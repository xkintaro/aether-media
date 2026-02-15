mod commands;
mod error;
mod modules;
mod state;
mod types;
use state::AppState;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .manage(AppState::new())
        .setup(|_app| Ok(()))
        .invoke_handler(tauri::generate_handler![
            commands::convert_file,
            commands::generate_thumbnail,
            commands::generate_thumbnails_batch,
            commands::cancel_conversion,
            commands::delete_thumbnails,
            commands::cleanup_all_temp_thumbnails,
            commands::get_file_info,
            commands::get_files_info_batch,
            commands::check_file_exists,
        ])
        .build(tauri::generate_context!())
        .expect("Code 101: Failed to initialize Tauri application runtime");
    app.run(|app_handle, event| {
        if let tauri::RunEvent::ExitRequested { .. } = event {
            let state = app_handle.state::<AppState>();
            tauri::async_runtime::block_on(async {
                state.kill_all_processes().await;
            });
        }
    });
}
