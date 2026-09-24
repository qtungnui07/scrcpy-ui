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
    // 1. Check local bin folder next to executable, cwd, or parent of cwd
    if let Ok(cwd) = env::current_dir() {
        for dir in [cwd.as_path(), cwd.parent().unwrap_or(cwd.as_path())] {
            let local_bin = dir.join("bin");
            if local_bin.exists() {
                return local_bin;
            }
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

    eprintln!("[resolve_binary] Looking for: {}", bin_name);

    // 1. Check in configured bin directory
    let bin_dir = get_bin_dir();
    eprintln!("[resolve_binary] bin_dir: {:?}", bin_dir);
    let candidate = bin_dir.join(&bin_name);
    if candidate.exists() && candidate.is_file() {
        eprintln!("[resolve_binary] Found in bin_dir: {:?}", candidate);
        return Some(candidate);
    }

    // 2. Check if present in nested subdirectories inside bin_dir
    if bin_dir.exists() {
        if let Ok(entries) = std::fs::read_dir(&bin_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    let sub_candidate = path.join(&bin_name);
                    eprintln!("[resolve_binary] Checking sub: {:?}", sub_candidate);
                    if sub_candidate.exists() && sub_candidate.is_file() {
                        eprintln!("[resolve_binary] Found in sub: {:?}", sub_candidate);
                        return Some(sub_candidate);
                    }
                }
            }
        }
    }

    // 3. Check next to the executable itself
    if let Ok(exe_path) = env::current_exe() {
        eprintln!("[resolve_binary] exe_path: {:?}", exe_path);
        if let Some(exe_dir) = exe_path.parent() {
            let candidate = exe_dir.join(&bin_name);
            if candidate.exists() && candidate.is_file() {
                return Some(candidate);
            }
            // Also check subdirectories next to executable
            if let Ok(entries) = std::fs::read_dir(exe_dir) {
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
    }

    // 4. Check in cwd, parent dir, and their subdirectories
    if let Ok(cwd) = env::current_dir() {
        for search_dir in [cwd.as_path(), cwd.parent().unwrap_or(cwd.as_path())] {
            let candidate = search_dir.join(&bin_name);
            if candidate.exists() && candidate.is_file() {
                return Some(candidate);
            }
            if let Ok(entries) = std::fs::read_dir(search_dir) {
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
    }

    // 5. Check system PATH
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
