use std::path::{Path, PathBuf};
use std::env;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct PlatformInfo {
    pub os: String,
    pub arch: String,
    pub bin_dir: String,
    pub scrcpy_name: String,
    pub adb_name: String,
}

pub fn get_platform_info() -> PlatformInfo {
    let os = env::consts::OS.to_string();
    let arch = env::consts::ARCH.to_string();
    let bin_dir = get_bin_dir().to_string_lossy().to_string();
    let (scrcpy_name, adb_name) = if cfg!(windows) {
        ("scrcpy.exe".to_string(), "adb.exe".to_string())
    } else {
        ("scrcpy".to_string(), "adb".to_string())
    };

    PlatformInfo {
        os,
        arch,
        bin_dir,
        scrcpy_name,
        adb_name,
    }
}

pub fn get_bin_dir() -> PathBuf {
    // 1. Check local bin folder next to executable or working directory
    if let Ok(cwd) = env::current_dir() {
        let local_bin = cwd.join("bin");
        if local_bin.exists() {
            return local_bin;
        }
    }

    // 2. Default to AppData / LocalData directory: ~/.scrcpy-hub/bin or AppData/Local/ScrcpyHub/bin
    if let Some(data_dir) = dirs::data_local_dir() {
        let app_bin = data_dir.join("ScrcpyHub").join("bin");
        return app_bin;
    }

    // Fallback
    PathBuf::from("bin")
}

pub fn resolve_binary(name: &str) -> Option<PathBuf> {
    let bin_name = if cfg!(windows) && !name.ends_with(".exe") {
        format!("{}.exe", name)
    } else {
        name.to_string()
    };

    // 1. Check in configured bin directory
    let bin_dir = get_bin_dir();
    let candidate = bin_dir.join(&bin_name);
    if candidate.exists() && candidate.is_file() {
        return Some(candidate);
    }

    // 2. Check if present in nested subdirectories inside bin_dir (e.g. extracted scrcpy-win64-vX.XX/)
    if bin_dir.exists() {
        if let Ok(entries) = std::fs::read_dir(&bin_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    let sub_candidate = path.join(&bin_name);
                    if sub_candidate.exists() && sub_candidate.is_file() {
                        return Some(sub_candidate);
                    }
                }
            }
        }
    }

    // 3. Check system PATH
    if let Ok(path) = which::which(&bin_name) {
        return Some(path);
    }

    None
}

#[cfg(unix)]
pub fn set_executable_permission(path: &Path) -> std::io::Result<()> {
    use std::os::unix::fs::PermissionsExt;
    let mut perms = std::fs::metadata(path)?.permissions();
    perms.set_mode(0o755);
    std::fs::set_permissions(path, perms)
}

#[cfg(not(unix))]
pub fn set_executable_permission(_path: &Path) -> std::io::Result<()> {
    Ok(())
}
