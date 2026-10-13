use crate::utils::platform::resolve_binary;
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdbDevice {
    pub serial: String,
    pub state: String, // "device" | "unauthorized" | "offline" | "connecting" | "unknown"
    pub model: Option<String>,
    pub product: Option<String>,
    pub device: Option<String>,
    pub transport_id: Option<String>,
    pub connection_type: String, // "USB" | "Wireless"
    pub ip_address: Option<String>,
    pub battery_level: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandOutput {
    pub success: bool,
    pub stdout: String,
    pub stderr: String,
    pub exit_code: Option<i32>,
}

fn get_adb_command() -> Result<Command, String> {
    let adb_path = resolve_binary("adb").ok_or_else(|| "ADB binary not found. Please download it first.".to_string())?;
    
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        let mut cmd = Command::new(adb_path);
        cmd.creation_flags(CREATE_NO_WINDOW);
        Ok(cmd)
    }

    #[cfg(not(windows))]
    {
        Ok(Command::new(adb_path))
    }
}

#[tauri::command]
pub async fn get_adb_devices() -> Result<Vec<AdbDevice>, String> {
    let mut cmd = get_adb_command()?;
    cmd.args(["devices", "-l"]);

    let output = cmd.output().map_err(|e| format!("Failed to execute adb devices: {}", e))?;
    let stdout = String::from_utf8_lossy(&output.stdout);

    let mut devices = Vec::new();
    let lines: Vec<&str> = stdout.lines().collect();

    let model_re = Regex::new(r"model:([^\s]+)").unwrap();
    let product_re = Regex::new(r"product:([^\s]+)").unwrap();
    let device_re = Regex::new(r"device:([^\s]+)").unwrap();
    let transport_re = Regex::new(r"transport_id:([^\s]+)").unwrap();
    let ip_port_re = Regex::new(r"^(\d{1,3}(?:\.\d{1,3}){3}):\d+$").unwrap();

    for line in lines {
        let line = line.trim();
        if line.is_empty() || line.starts_with("List of devices attached") || line.starts_with("* daemon") {
            continue;
        }

        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.is_empty() {
            continue;
        }

        let serial = parts[0].to_string();
        let state = if parts.len() > 1 {
            parts[1].to_string()
        } else {
            "unknown".to_string()
        };

        // Legacy TCP/IP devices use `192.168.x.x:5555`; Android 11+ Wireless
        // Debugging uses an mDNS serial such as `adb-<id>._adb-tls-connect._tcp`.
        // Both must be shown as Wi-Fi instead of falling back to USB.
        let is_wireless = ip_port_re.is_match(&serial)
            || serial.contains(':')
            || serial.starts_with("adb-")
            || serial.contains("_adb-tls-connect")
            || serial.contains("_adb-tls-pairing");
        let connection_type = if is_wireless {
            "Wireless".to_string()
        } else {
            "USB".to_string()
        };

        let ip_address = ip_port_re
            .captures(&serial)
            .map(|caps| caps[1].to_string());

        let model = model_re.captures(line).map(|c| c[1].replace('_', " "));
        let product = product_re.captures(line).map(|c| c[1].to_string());
        let device = device_re.captures(line).map(|c| c[1].to_string());
        let transport_id = transport_re.captures(line).map(|c| c[1].to_string());

        devices.push(AdbDevice {
            serial,
            state,
            model,
            product,
            device,
            transport_id,
            connection_type,
            ip_address,
            // Keep device discovery to one lightweight `adb devices -l` command. Running
            // a shell command per device on every refresh competes with a wireless scrcpy
            // stream and can make an otherwise healthy ADB-over-Wi-Fi connection unstable.
            battery_level: None,
        });
    }

    Ok(devices)
}

#[tauri::command]
pub async fn pair_wireless_device(ip: String, port: u16, code: String) -> Result<CommandOutput, String> {
    let address = format!("{}:{}", ip.trim(), port);
    let mut cmd = get_adb_command()?;
    cmd.args(["pair", &address, code.trim()]);

    let output = cmd.output().map_err(|e| format!("Pair command execution failed: {}", e))?;
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    let success = output.status.success() && (stdout.to_lowercase().contains("successfully paired") || !stdout.to_lowercase().contains("error"));

    Ok(CommandOutput {
        success,
        stdout,
        stderr,
        exit_code: output.status.code(),
    })
}

#[tauri::command]
pub async fn connect_wireless_device(ip: String, port: u16) -> Result<CommandOutput, String> {
    let address = format!("{}:{}", ip.trim(), port);
    let mut cmd = get_adb_command()?;
    cmd.args(["connect", &address]);

    let output = cmd.output().map_err(|e| format!("Connect command execution failed: {}", e))?;
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    let success = output.status.success() && (stdout.to_lowercase().contains("connected to") || stdout.to_lowercase().contains("already connected"));

    Ok(CommandOutput {
        success,
        stdout,
        stderr,
        exit_code: output.status.code(),
    })
}

#[tauri::command]
pub async fn disconnect_wireless_device(target: String) -> Result<CommandOutput, String> {
    let mut cmd = get_adb_command()?;
    cmd.args(["disconnect", target.trim()]);

    let output = cmd.output().map_err(|e| format!("Disconnect command failed: {}", e))?;
    Ok(CommandOutput {
        success: output.status.success(),
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        exit_code: output.status.code(),
    })
}

#[tauri::command]
pub async fn enable_tcpip(serial: String, port: Option<u16>) -> Result<CommandOutput, String> {
    let port_str = port.unwrap_or(5555).to_string();
    let mut cmd = get_adb_command()?;
    cmd.args(["-s", serial.trim(), "tcpip", &port_str]);

    let output = cmd.output().map_err(|e| format!("TCP/IP command failed: {}", e))?;
    Ok(CommandOutput {
        success: output.status.success(),
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        exit_code: output.status.code(),
    })
}

#[tauri::command]
pub async fn get_device_wifi_ip(serial: String) -> Result<String, String> {
    let mut cmd = get_adb_command()?;
    cmd.args(["-s", serial.trim(), "shell", "ip", "-f", "inet", "addr", "show", "wlan0"]);

    let output = cmd.output().map_err(|e| format!("Failed to query IP: {}", e))?;
    let stdout = String::from_utf8_lossy(&output.stdout);

    let ip_re = Regex::new(r"inet\s+(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})").unwrap();
    if let Some(caps) = ip_re.captures(&stdout) {
        return Ok(caps[1].to_string());
    }

    // Fallback try getprop
    let mut cmd2 = get_adb_command()?;
    cmd2.args(["-s", serial.trim(), "shell", "getprop", "dhcp.wlan0.ipaddress"]);
    let output2 = cmd2.output().map_err(|e| format!("Failed to query fallback IP: {}", e))?;
    let ip2 = String::from_utf8_lossy(&output2.stdout).trim().to_string();
    if !ip2.is_empty() {
        return Ok(ip2);
    }

    Err("Could not detect device Wi-Fi IP address. Ensure Wi-Fi is enabled on phone.".into())
}

#[tauri::command]
pub async fn reboot_device(serial: String, target: Option<String>) -> Result<CommandOutput, String> {
    let mut cmd = get_adb_command()?;
    let mut args = vec!["-s".to_string(), serial.trim().to_string(), "reboot".to_string()];
    if let Some(t) = target {
        if !t.trim().is_empty() && t != "system" {
            args.push(t.trim().to_string());
        }
    }
    cmd.args(args);

    let output = cmd.output().map_err(|e| format!("Reboot failed: {}", e))?;
    Ok(CommandOutput {
        success: output.status.success(),
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        exit_code: output.status.code(),
    })
}

#[tauri::command]
pub async fn run_adb_raw(args: Vec<String>) -> Result<CommandOutput, String> {
    let mut cmd = get_adb_command()?;
    cmd.args(args);

    let output = cmd.output().map_err(|e| format!("Command failed: {}", e))?;
    Ok(CommandOutput {
        success: output.status.success(),
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        exit_code: output.status.code(),
    })
}
