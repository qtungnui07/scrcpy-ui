pub mod commands;
pub mod utils;

use commands::scrcpy::AppState;
use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            // Binary downloader commands
            commands::downloader::get_binary_status,
            commands::downloader::check_latest_release,
            commands::downloader::download_and_extract_engine,
            commands::downloader::check_and_auto_update,
            // ADB commands
            commands::adb::get_adb_devices,
            commands::adb::pair_wireless_device,
            commands::adb::connect_wireless_device,
            commands::adb::disconnect_wireless_device,
            commands::adb::enable_tcpip,
            commands::adb::get_device_wifi_ip,
            commands::adb::reboot_device,
            commands::adb::run_adb_raw,
            // Scrcpy session commands
            commands::scrcpy::launch_scrcpy_session,
            commands::scrcpy::stop_scrcpy_session,
            commands::scrcpy::stop_all_sessions,
            commands::scrcpy::get_active_sessions,
            // Quick action commands
            commands::scrcpy::send_keyevent,
            commands::scrcpy::send_text_input,
            commands::scrcpy::take_screenshot,
            commands::scrcpy::install_apk,
            commands::scrcpy::push_file,
        ])
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window;
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running scrcpy-hub application");
}
