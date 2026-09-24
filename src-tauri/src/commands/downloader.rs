use crate::utils::platform::{get_bin_dir, resolve_binary, set_executable_permission};
use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use std::fs::{self, File};
use std::io::{self, Cursor};
use std::path::{Path, PathBuf};
use std::process::Command;
use tauri::{AppHandle, Emitter};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BinaryStatus {
    pub scrcpy_path: Option<String>,
    pub adb_path: Option<String>,
    pub scrcpy_version: Option<String>,
    pub adb_version: Option<String>,
    pub is_ready: bool,
    pub bin_dir: String,
    pub installed_tag: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReleaseInfo {
    pub tag_name: String,
    pub name: String,
    pub download_url: String,
    pub asset_name: String,
    pub size: u64,
    pub body: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadProgressPayload {
    pub stage: String, // "fetching" | "downloading" | "extracting" | "finished" | "error"
    pub progress: f64, // 0.0 - 100.0
    pub downloaded_bytes: u64,
    pub total_bytes: u64,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateCheckResult {
    pub needs_update: bool,
    pub installed_tag: Option<String>,
    pub latest_tag: Option<String>,
    pub auto_downloading: bool,
    pub message: String,
}

#[derive(Deserialize)]
struct GitHubRelease {
    tag_name: String,
    name: Option<String>,
    body: Option<String>,
    assets: Vec<GitHubAsset>,
}

#[derive(Deserialize)]
struct GitHubAsset {
    name: String,
    size: u64,
    browser_download_url: String,
}

#[tauri::command]
pub async fn get_binary_status() -> Result<BinaryStatus, String> {
    let bin_dir = get_bin_dir();
    let scrcpy_path = resolve_binary("scrcpy");
    let adb_path = resolve_binary("adb");

    let scrcpy_version = scrcpy_path.as_ref().and_then(|path| {
        let output = Command::new(path).arg("--version").output().ok()?;
        let stdout = String::from_utf8_lossy(&output.stdout);
        let first_line = stdout.lines().next().unwrap_or("scrcpy");
        Some(first_line.trim().to_string())
    });

    let adb_version = adb_path.as_ref().and_then(|path| {
        let output = Command::new(path).arg("version").output().ok()?;
        let stdout = String::from_utf8_lossy(&output.stdout);
        let first_line = stdout.lines().next().unwrap_or("adb");
        Some(first_line.trim().to_string())
    });

    let is_ready = scrcpy_path.is_some() && adb_path.is_some();
    let installed_tag = read_installed_tag(&bin_dir);

    Ok(BinaryStatus {
        scrcpy_path: scrcpy_path.map(|p| p.to_string_lossy().to_string()),
        adb_path: adb_path.map(|p| p.to_string_lossy().to_string()),
        scrcpy_version,
        adb_version,
        is_ready,
        bin_dir: bin_dir.to_string_lossy().to_string(),
        installed_tag,
    })
}

#[tauri::command]
pub async fn check_latest_release() -> Result<ReleaseInfo, String> {
    let client = reqwest::Client::builder()
        .user_agent("ScrcpyHub-Desktop-App/1.0")
        .build()
        .map_err(|e| e.to_string())?;

    let url = "https://api.github.com/repos/Genymobile/scrcpy/releases/latest";
    let resp = client
        .get(url)
        .send()
        .await
        .map_err(|e| format!("Failed to reach GitHub API: {}", e))?;

    if !resp.status().is_success() {
        return Err(format!("GitHub API error: status {}", resp.status()));
    }

    let release: GitHubRelease = resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse release JSON: {}", e))?;

    // Determine matching asset for current platform
    let is_win = cfg!(windows);
    let is_64 = cfg!(target_pointer_width = "64");

    let matching_asset = release.assets.iter().find(|asset| {
        let name = asset.name.to_lowercase();
        if is_win {
            if is_64 {
                name.contains("win64") && name.ends_with(".zip")
            } else {
                name.contains("win32") && name.ends_with(".zip")
            }
        } else {
            // Linux/macOS assets (or source)
            name.ends_with(".tar.gz") || name.ends_with(".zip")
        }
    });

    let selected = matching_asset
        .or_else(|| release.assets.first())
        .ok_or_else(|| "No release asset found".to_string())?;

    Ok(ReleaseInfo {
        tag_name: release.tag_name,
        name: release.name.unwrap_or_else(|| "Scrcpy Latest Release".into()),
        download_url: selected.browser_download_url.clone(),
        asset_name: selected.name.clone(),
        size: selected.size,
        body: release.body.unwrap_or_default(),
    })
}

#[tauri::command]
pub async fn download_and_extract_engine(
    app: AppHandle,
    download_url: Option<String>,
) -> Result<BinaryStatus, String> {
    let target_url = match download_url {
        Some(url) => url,
        None => {
            let release = check_latest_release().await?;
            release.download_url
        }
    };

    let bin_dir = get_bin_dir();
    fs::create_dir_all(&bin_dir)
        .map_err(|e| format!("Failed to create bin dir {}: {}", bin_dir.display(), e))?;

    let _ = app.emit(
        "download-progress",
        DownloadProgressPayload {
            stage: "fetching".into(),
            progress: 0.0,
            downloaded_bytes: 0,
            total_bytes: 0,
            message: "Connecting to GitHub servers...".into(),
        },
    );

    let client = reqwest::Client::builder()
        .user_agent("ScrcpyHub-Desktop-App/1.0")
        .build()
        .map_err(|e| e.to_string())?;

    let resp = client
        .get(&target_url)
        .send()
        .await
        .map_err(|e| format!("Failed to download asset: {}", e))?;

    let total_size = resp.content_length().unwrap_or(0);
    let mut downloaded: u64 = 0;
    let mut stream = resp.bytes_stream();
    let mut archive_bytes = Vec::with_capacity(total_size as usize);

    while let Some(chunk_result) = stream.next().await {
        let chunk = chunk_result.map_err(|e| format!("Stream read error: {}", e))?;
        archive_bytes.extend_from_slice(&chunk);
        downloaded += chunk.len() as u64;

        let progress = if total_size > 0 {
            (downloaded as f64 / total_size as f64) * 100.0
        } else {
            0.0
        };

        let _ = app.emit(
            "download-progress",
            DownloadProgressPayload {
                stage: "downloading".into(),
                progress,
                downloaded_bytes: downloaded,
                total_bytes: total_size,
                message: format!(
                    "Downloading: {:.1} MB / {:.1} MB ({:.0}%)",
                    downloaded as f64 / 1_048_576.0,
                    total_size as f64 / 1_048_576.0,
                    progress
                ),
            },
        );
    }

    let _ = app.emit(
        "download-progress",
        DownloadProgressPayload {
            stage: "extracting".into(),
            progress: 100.0,
            downloaded_bytes: downloaded,
            total_bytes: total_size,
            message: "Extracting binaries into local directory...".into(),
        },
    );

    // Extract archive
    if target_url.ends_with(".zip") {
        extract_zip(&archive_bytes, &bin_dir)?;
    } else if target_url.ends_with(".tar.gz") || target_url.ends_with(".tgz") {
        extract_tar_gz(&archive_bytes, &bin_dir)?;
    } else {
        // Assume zip if unknown
        extract_zip(&archive_bytes, &bin_dir)?;
    }

    // Ensure permissions
    if let Ok(entries) = fs::read_dir(&bin_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            let _ = set_executable_permission(&path);
        }
    }

    let _ = app.emit(
        "download-progress",
        DownloadProgressPayload {
            stage: "finished".into(),
            progress: 100.0,
            downloaded_bytes: downloaded,
            total_bytes: total_size,
            message: "Binaries ready to use!".into(),
        },
    );

    get_binary_status().await
}

fn extract_zip(bytes: &[u8], target_dir: &Path) -> Result<(), String> {
    let reader = Cursor::new(bytes);
    let mut zip = zip::ZipArchive::new(reader).map_err(|e| format!("Invalid zip archive: {}", e))?;

    // Check if everything is inside a top-level directory (e.g. scrcpy-win64-v3.1/)
    let mut common_prefix: Option<PathBuf> = None;
    for i in 0..zip.len() {
        let file = zip.by_index(i).map_err(|e| e.to_string())?;
        let path = PathBuf::from(file.name());
        let components: Vec<_> = path.components().collect();
        if components.len() > 1 {
            let first = PathBuf::from(components[0].as_os_str());
            if common_prefix.is_none() {
                common_prefix = Some(first);
            }
        }
    }

    for i in 0..zip.len() {
        let mut file = zip.by_index(i).map_err(|e| e.to_string())?;
        let raw_path = match file.enclosed_name() {
            Some(p) => p.to_owned(),
            None => continue,
        };

        // Strip prefix if present so binaries land cleanly in target_dir
        let relative_path = if let Some(ref prefix) = common_prefix {
            raw_path.strip_prefix(prefix).unwrap_or(&raw_path).to_path_buf()
        } else {
            raw_path
        };

        if relative_path.as_os_str().is_empty() {
            continue;
        }

        let outpath = target_dir.join(&relative_path);

        if file.is_dir() {
            fs::create_dir_all(&outpath).map_err(|e| e.to_string())?;
        } else {
            if let Some(p) = outpath.parent() {
                if !p.exists() {
                    fs::create_dir_all(p).map_err(|e| e.to_string())?;
                }
            }
            let mut outfile = File::create(&outpath).map_err(|e| e.to_string())?;
            io::copy(&mut file, &mut outfile).map_err(|e| e.to_string())?;
            let _ = set_executable_permission(&outpath);
        }
    }

    Ok(())
}

fn extract_tar_gz(bytes: &[u8], target_dir: &Path) -> Result<(), String> {
    use flate2::read::GzDecoder;
    use tar::Archive;

    let tar = GzDecoder::new(Cursor::new(bytes));
    let mut archive = Archive::new(tar);
    archive.unpack(target_dir).map_err(|e| format!("Failed to unpack tar.gz: {}", e))?;
    Ok(())
}

fn save_installed_tag(bin_dir: &Path, tag: &str) {
    let version_file = bin_dir.join(".scrcpy_version");
    let _ = fs::write(version_file, tag);
}

fn read_installed_tag(bin_dir: &Path) -> Option<String> {
    let version_file = bin_dir.join(".scrcpy_version");
    fs::read_to_string(version_file).ok().map(|s| s.trim().to_string()).filter(|s| !s.is_empty())
}

#[tauri::command]
pub async fn check_and_auto_update(app: AppHandle) -> Result<UpdateCheckResult, String> {
    let bin_dir = get_bin_dir();
    let installed_tag = read_installed_tag(&bin_dir);
    let has_scrcpy = resolve_binary("scrcpy").is_some();

    // If scrcpy binary exists and we have a version tag, check for updates
    // If no binary at all, force download
    let latest = match check_latest_release().await {
        Ok(r) => r,
        Err(e) => {
            if !has_scrcpy {
                return Ok(UpdateCheckResult {
                    needs_update: true,
                    installed_tag: installed_tag.clone(),
                    latest_tag: None,
                    auto_downloading: false,
                    message: format!("No scrcpy found and cannot check updates: {}", e),
                });
            }
            return Ok(UpdateCheckResult {
                needs_update: false,
                installed_tag,
                latest_tag: None,
                auto_downloading: false,
                message: format!("Offline, using existing binaries. ({})", e),
            });
        }
    };

    let latest_tag = latest.tag_name.clone();
    let needs_update = !has_scrcpy || installed_tag.as_deref() != Some(&latest_tag);

    if needs_update {
        let _ = app.emit(
            "download-progress",
            DownloadProgressPayload {
                stage: "fetching".into(),
                progress: 0.0,
                downloaded_bytes: 0,
                total_bytes: 0,
                message: format!(
                    "Auto-updating scrcpy to {}...",
                    latest_tag
                ),
            },
        );

        let tag_for_save = latest_tag.clone();
        match download_and_extract_engine(app, Some(latest.download_url)).await {
            Ok(_) => {
                save_installed_tag(&get_bin_dir(), &tag_for_save);
                Ok(UpdateCheckResult {
                    needs_update: false,
                    installed_tag: Some(tag_for_save.clone()),
                    latest_tag: Some(tag_for_save),
                    auto_downloading: false,
                    message: "scrcpy updated successfully!".into(),
                })
            }
            Err(e) => Ok(UpdateCheckResult {
                needs_update: true,
                installed_tag,
                latest_tag: Some(latest_tag),
                auto_downloading: false,
                message: format!("Auto-update failed: {}", e),
            }),
        }
    } else {
        Ok(UpdateCheckResult {
            needs_update: false,
            installed_tag,
            latest_tag: Some(latest_tag),
            auto_downloading: false,
            message: "scrcpy is up to date.".into(),
        })
    }
}
