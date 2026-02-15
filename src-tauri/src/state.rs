use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::process::Child;
use tokio::sync::Mutex;

pub struct AppState {
    pub running_processes: Arc<Mutex<HashMap<String, Child>>>,
    pub output_paths: Arc<Mutex<HashMap<String, PathBuf>>>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            running_processes: Arc::new(Mutex::new(HashMap::new())),
            output_paths: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub async fn register_process(&self, id: String, child: Child) {
        let mut processes = self.running_processes.lock().await;
        processes.insert(id, child);
    }

    pub async fn register_output_path(&self, id: String, path: PathBuf) {
        let mut paths = self.output_paths.lock().await;
        paths.insert(id, path);
    }

    pub async fn remove_process(&self, id: &str) -> Option<Child> {
        let mut processes = self.running_processes.lock().await;
        processes.remove(id)
    }

    pub async fn remove_output_path(&self, id: &str) -> Option<PathBuf> {
        let mut paths = self.output_paths.lock().await;
        paths.remove(id)
    }

    pub async fn kill_process(&self, id: &str) -> Result<(), String> {
        let mut processes = self.running_processes.lock().await;

        if let Some(child) = processes.get_mut(id) {
            if let Err(e) = child.kill().await {
                return Err(format!("Failed to kill process {}: {}", id, e));
            }
            processes.remove(id);
        }

        drop(processes);

        if let Some(output_path) = self.remove_output_path(id).await {
            if output_path.exists() {
                let _ = tokio::fs::remove_file(&output_path).await;
            }
        }

        Ok(())
    }

    pub async fn kill_all_processes(&self) {
        let mut processes = self.running_processes.lock().await;
        for (_id, child) in processes.iter_mut() {
            let _ = child.kill().await;
        }
        processes.clear();

        let mut paths = self.output_paths.lock().await;
        for (_id, path) in paths.iter() {
            if path.exists() {
                let _ = tokio::fs::remove_file(path).await;
            }
        }
        paths.clear();
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}
