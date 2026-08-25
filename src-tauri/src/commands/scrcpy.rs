use crate::utils::platform::resolve_binary;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::process::Stdio;
use std::sync::Arc;
use tauri::{AppHandle, Emitter, State};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;
use tokio::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScrcpySession {
    pub id: String,
    pub serial: String,
    pub pid: Option<u32>,
    pub start_time: String,
    pub status: String, // "running" | "stopped" | "error"
    pub args: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScrcpyLogPayload {
    pub session_id: String,
    pub serial: String,
    pub level: String, // "stdout" | "stderr" | "info" | "error"
    pub message: String,
    pub timestamp: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionStatusPayload {
    pub session_id: String,
    pub serial: String,
    pub status: String,
    pub exit_code: Option<i32>,
    pub message: Option<String>,
}

pub struct ActiveSession {
    pub session: ScrcpySession,
    pub kill_sender: Option<tokio::sync::oneshot::Sender<()>>,
}

#[derive(Default)]
pub struct AppState {
    pub sessions: Arc<Mutex<HashMap<String, ActiveSession>>>,
}

#[tauri::command]
pub async fn get_active_sessions(state: State<'_, AppState>) -> Result<Vec<ScrcpySession>, String> {
    let map = state.sessions.lock().await;
    let list = map.values().map(|s| s.session.clone()).collect();
    Ok(list)
}

#[tauri::command]
pub async fn launch_scrcpy_session(
    app: AppHandle,
    state: State<'_, AppState>,
    session_id: String,
    serial: String,
    custom_args: Vec<String>,
) -> Result<ScrcpySession, String> {
    let scrcpy_path = resolve_binary("scrcpy").ok_or_else(|| {
        "scrcpy binary not found! Please make sure it is downloaded or in PATH.".to_string()
    })?;

    // Build args list
    let mut args = vec!["-s".to_string(), serial.clone()];
    args.extend(custom_args.clone());

    let mut cmd = Command::new(&scrcpy_path);
    cmd.args(&args);
    cmd.stdout(Stdio::piped());
    cmd.stderr(Stdio::piped());

    #[cfg(windows)]
    {
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }

    let mut child = cmd.spawn().map_err(|e| format!("Failed to spawn scrcpy process: {}", e))?;
    let pid = child.id();

    let session_info = ScrcpySession {
        id: session_id.clone(),
        serial: serial.clone(),
        pid,
        start_time: Utc::now().to_rfc3339(),
        status: "running".to_string(),
        args: args.clone(),
    };

    let (kill_tx, mut kill_rx) = tokio::sync::oneshot::channel::<()>();

    {
        let mut map = state.sessions.lock().await;
        map.insert(
            session_id.clone(),
            ActiveSession {
                session: session_info.clone(),
                kill_sender: Some(kill_tx),
            },
        );
    }

    let stdout = child.stdout.take();
    let stderr = child.stderr.take();

    let app_clone = app.clone();
    let sess_id_out = session_id.clone();
    let serial_out = serial.clone();
    if let Some(stdout) = stdout {
        tokio::spawn(async move {
            let mut reader = BufReader::new(stdout).lines();
            while let Ok(Some(line)) = reader.next_line().await {
                let _ = app_clone.emit(
                    "scrcpy-log",
                    ScrcpyLogPayload {
                        session_id: sess_id_out.clone(),
                        serial: serial_out.clone(),
                        level: "stdout".to_string(),
                        message: line,
                        timestamp: Utc::now().to_rfc3339(),
                    },
                );
            }
        });
    }

    let app_clone2 = app.clone();
    let sess_id_err = session_id.clone();
    let serial_err = serial.clone();
    if let Some(stderr) = stderr {
        tokio::spawn(async move {
            let mut reader = BufReader::new(stderr).lines();
            while let Ok(Some(line)) = reader.next_line().await {
                let _ = app_clone2.emit(
                    "scrcpy-log",
                    ScrcpyLogPayload {
                        session_id: sess_id_err.clone(),
                        serial: serial_err.clone(),
                        level: "stderr".to_string(),
                        message: line,
                        timestamp: Utc::now().to_rfc3339(),
                    },
                );
            }
        });
    }

    // Monitor child process exit
    let app_clone3 = app.clone();
    let sess_id_mon = session_id.clone();
    let serial_mon = serial.clone();
    let sessions_map_ref = state.sessions.clone();

    tokio::spawn(async move {
        tokio::select! {
            status_res = child.wait() => {
                let exit_code = match status_res {
                    Ok(st) => st.code(),
                    Err(_) => None,
                };

                let _ = app_clone3.emit(
                    "session-status-changed",
                    SessionStatusPayload {
                        session_id: sess_id_mon.clone(),
                        serial: serial_mon.clone(),
                        status: "stopped".to_string(),
                        exit_code,
                        message: Some(format!("Process exited with code {:?}", exit_code)),
                    },
                );

                let mut map = sessions_map_ref.lock().await;
                map.remove(&sess_id_mon);
            }
            _ = &mut kill_rx => {
                let _ = child.kill().await;
                let _ = app_clone3.emit(
                    "session-status-changed",
                    SessionStatusPayload {
                        session_id: sess_id_mon.clone(),
                        serial: serial_mon.clone(),
                        status: "stopped".to_string(),
                        exit_code: Some(0),
                        message: Some("Session stopped by user".to_string()),
                    },
                );
                let mut map = sessions_map_ref.lock().await;
                map.remove(&sess_id_mon);
            }
        }
    });

    let _ = app.emit(
        "session-status-changed",
        SessionStatusPayload {
            session_id: session_id.clone(),
            serial: serial.clone(),
            status: "running".to_string(),
            exit_code: None,
            message: Some(format!("Mirroring started for device {}", serial)),
        },
    );

    Ok(session_info)
}

#[tauri::command]
pub async fn stop_scrcpy_session(
    state: State<'_, AppState>,
    session_id: String,
) -> Result<bool, String> {
    let mut map = state.sessions.lock().await;
    if let Some(mut active) = map.remove(&session_id) {
        if let Some(kill_tx) = active.kill_sender.take() {
            let _ = kill_tx.send(());
        }
        return Ok(true);
    }
    Ok(false)
}

#[tauri::command]
pub async fn stop_all_sessions(state: State<'_, AppState>) -> Result<u32, String> {
    let mut map = state.sessions.lock().await;
    let mut count = 0;
    for (_, mut active) in map.drain() {
        if let Some(kill_tx) = active.kill_sender.take() {
            let _ = kill_tx.send(());
            count += 1;
        }
    }
    Ok(count)
}

// Quick Actions

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActionResult {
    pub success: bool,
    pub message: String,
    pub data: Option<String>,
}

fn get_adb_cmd() -> Result<std::process::Command, String> {
    let adb_path = resolve_binary("adb").ok_or_else(|| "ADB binary not found.".to_string())?;
    
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        let mut cmd = std::process::Command::new(adb_path);
        cmd.creation_flags(CREATE_NO_WINDOW);
        Ok(cmd)
    }

    #[cfg(not(windows))]
    {
        Ok(std::process::Command::new(adb_path))
    }
}

#[tauri::command]
pub async fn send_keyevent(serial: String, keycode: u32) -> Result<ActionResult, String> {
    let mut cmd = get_adb_cmd()?;
    cmd.args(["-s", serial.trim(), "shell", "input", "keyevent", &keycode.to_string()]);

    let output = cmd.output().map_err(|e| format!("Failed to send keyevent: {}", e))?;
    Ok(ActionResult {
        success: output.status.success(),
        message: if output.status.success() {
            format!("Keyevent {} sent successfully", keycode)
        } else {
            String::from_utf8_lossy(&output.stderr).to_string()
        },
        data: None,
    })
}

#[tauri::command]
pub async fn send_text_input(serial: String, text: String) -> Result<ActionResult, String> {
    let escaped = text.replace(' ', "%s");
    let mut cmd = get_adb_cmd()?;
    cmd.args(["-s", serial.trim(), "shell", "input", "text", &escaped]);

    let output = cmd.output().map_err(|e| format!("Failed to send text: {}", e))?;
    Ok(ActionResult {
        success: output.status.success(),
        message: if output.status.success() {
            "Text sent successfully".into()
        } else {
            String::from_utf8_lossy(&output.stderr).to_string()
        },
        data: None,
    })
}

#[tauri::command]
pub async fn take_screenshot(
    serial: String,
    save_path: Option<String>,
) -> Result<ActionResult, String> {
    let dest_path = match save_path {
        Some(p) => PathBuf::from(p),
        None => {
            let pic_dir = dirs::picture_dir()
                .or_else(dirs::download_dir)
                .unwrap_or_else(|| PathBuf::from("."));
            let hub_dir = pic_dir.join("ScrcpyHub");
            let _ = std::fs::create_dir_all(&hub_dir);
            let timestamp = Utc::now().format("%Y%m%d_%H%M%S");
            hub_dir.join(format!("screenshot_{}_{}.png", serial.replace(':', "_"), timestamp))
        }
    };

    let mut cmd = get_adb_cmd()?;
    cmd.args(["-s", serial.trim(), "exec-out", "screencap", "-p"]);

    let output = cmd.output().map_err(|e| format!("Screenshot capture failed: {}", e))?;
    if !output.status.success() || output.stdout.is_empty() {
        return Ok(ActionResult {
            success: false,
            message: format!("Screencap failed: {}", String::from_utf8_lossy(&output.stderr)),
            data: None,
        });
    }

    std::fs::write(&dest_path, &output.stdout)
        .map_err(|e| format!("Failed to save screenshot file: {}", e))?;

    Ok(ActionResult {
        success: true,
        message: format!("Screenshot saved to {}", dest_path.display()),
        data: Some(dest_path.to_string_lossy().to_string()),
    })
}

#[tauri::command]
pub async fn install_apk(serial: String, apk_path: String) -> Result<ActionResult, String> {
    let mut cmd = get_adb_cmd()?;
    cmd.args(["-s", serial.trim(), "install", "-r", apk_path.trim()]);

    let output = cmd.output().map_err(|e| format!("APK install failed: {}", e))?;
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    let success = output.status.success() && stdout.contains("Success");

    Ok(ActionResult {
        success,
        message: if success {
            "APK installed successfully!".to_string()
        } else {
            format!("Install output: {} {}", stdout, stderr).trim().to_string()
        },
        data: Some(stdout),
    })
}

#[tauri::command]
pub async fn push_file(
    serial: String,
    local_path: String,
    remote_path: Option<String>,
) -> Result<ActionResult, String> {
    let dest = remote_path.unwrap_or_else(|| "/sdcard/Download/".to_string());
    let mut cmd = get_adb_cmd()?;
    cmd.args(["-s", serial.trim(), "push", local_path.trim(), &dest]);

    let output = cmd.output().map_err(|e| format!("File push failed: {}", e))?;
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    let success = output.status.success();

    Ok(ActionResult {
        success,
        message: if success {
            format!("File pushed successfully to {}", dest)
        } else {
            format!("Push error: {} {}", stdout, stderr).trim().to_string()
        },
        data: Some(stdout),
    })
}
