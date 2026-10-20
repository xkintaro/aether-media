use std::ffi::OsString;
use std::path::Path;

pub(super) struct FFmpegCommandBuilder {
    args: Vec<OsString>,
}

impl FFmpegCommandBuilder {
    pub(super) fn new() -> Self {
        Self { args: Vec::new() }
    }

    pub(super) fn input(mut self, path: &Path) -> Self {
        self.args.push("-i".into());
        self.args.push(path.as_os_str().to_owned());
        self
    }

    pub(super) fn overwrite(mut self, overwrite: bool) -> Self {
        self.args.push(if overwrite { "-y" } else { "-n" }.into());
        self
    }

    pub(super) fn progress(mut self) -> Self {
        self.args.push("-progress".into());
        self.args.push("pipe:2".into());
        self
    }

    pub(super) fn strip_metadata(mut self, strip: bool) -> Self {
        if strip {
            self.args.push("-map_metadata".into());
            self.args.push("-1".into());
            self.args.push("-map_chapters".into());
            self.args.push("-1".into());
        }
        self
    }

    pub(super) fn strip_metadata_audio(mut self, strip: bool) -> Self {
        if strip {
            self.args.push("-map_metadata".into());
            self.args.push("-1".into());
        }
        self
    }

    pub(super) fn mute(mut self, is_muted: bool) -> Self {
        if is_muted {
            self.args.push("-an".into());
        }
        self
    }

    pub(super) fn skip_video(mut self) -> Self {
        self.args.push("-vn".into());
        self
    }

    pub(super) fn ignore_unknown(mut self) -> Self {
        self.args.push("-ignore_unknown".into());
        self
    }

    pub(super) fn arg(mut self, key: &str, value: &str) -> Self {
        self.args.push(key.into());
        self.args.push(value.into());
        self
    }

    pub(super) fn filter_complex(mut self, filter: String) -> Self {
        self.args.push("-vf".into());
        self.args.push(filter.into());
        self
    }

    pub(super) fn output(mut self, path: &Path) -> Self {
        self.args.push(path.as_os_str().to_owned());
        self
    }

    pub(super) fn build(self) -> Vec<OsString> {
        self.args
    }
}
