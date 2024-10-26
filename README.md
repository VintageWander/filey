# Filey

Filey - a simple peer-to-peer file sharing app, used for transfering and view files, as a lightweight alternative to
FTP solutions, which might require a lot of setup that some people did not want to put up the time to work with

This is the source code of my personal developed file transfering tool that I developed and used for quite some time,
and now I'm publishing the code online for other people to take a look at, and can compile and use for themselves

This GitHub repo is not a 1:1 copy of the original tool that I'm currently having, there will be some issues here
and there but in general the tool has minimal bugs

# Tech used

-   Interface: `React` (`TypeScript`)
-   Engine: `Tauri`(webview) + `Axum`(HTTP server) (`Rust`)
-   Database: `SQLite`

# Known issues

Currently for whatever reason, the android build does not include the capability to show image or video embedded inside the app. <br>
Therefore when you preview an image or an mp4 video, it will open the default browser for you to view

# Usage instructions

As for now I haven't published a release build for this application, however you can build it for yourself.
The dev version runs fine on macOS and Android, since those are the devices that I have at my disposal

## Pre-requisites

You need to have [`NodeJS`](https://nodejs.org/en) and [`Rust`](https://www.rust-lang.org/) installed

## Build

### For macOS:

```bash
npx tauri build -- --bundles dmg
```

### For Android:

[You have to sign the application first, or else Android WILL NOT let you install. \
Follow this guide after downloading the source code](https://tauri.app/distribute/sign/android/)

```bash
npx tauri android build --apk --target aarch64
```

### For iOS:

You'll need to sign the application with your Apple Developer account, I've only tested this application in a simulator

```bash
npx tauri ios build
```

### For Windows:

Build it on a real Windows machine or a VM

#### X86_64:

```bash
npx tauri build
```

#### ARM64:

Pre-requisites for building on ARM64 Windows:

1. [Install Visual Studio](https://visualstudio.microsoft.com/)
2. When the installer appear, choose `Desktop development with C++`, go to the Individual Components section and choose
   C++ Clang Compiler for Windows, and then install
3. Add this line to the PATH section of Environment Variables
   `C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Tools\Llvm\ARM64\bin`
4. Finally
    ```bash
    npx tauri build
    ```

Does not work currently, the application compiles until this error is shown: \
`Unknown Scheme: cannot make HTTPS request because no TLS backend is configured`
