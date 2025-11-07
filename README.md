# Gitcomi

## 開発

```bash
npm install
npm run dev
```

## 配布用ビルド

`npm run package` で `dist/` の成果物だけを含む最小構成の Electron アプリを `@electron/packager` で作成します。

1. 依存関係を導入してから `npm run package` を実行。
2. `release/` 直下に `Gitcomi-<platform>-<arch>/` が生成されます（例: `Gitcomi-linux-x64`）。そのディレクトリを zip/tar すれば、そのまま配布できます。
3. 別プラットフォームをまとめて用意したい場合は環境変数で指定します。

```bash
# Linux / Windows / macOS を同時に作る例
PACKAGER_PLATFORMS="linux,win32,darwin" PACKAGER_ARCHES="x64" npm run package
```

生成物にはビルド済みの `dist` と Electron 本体だけが含まれるため、受け取った側はアーカイブを展開して次のように起動できます。

- **Windows**: `Gitcomi-win32-x64/Gitcomi.exe` をそのまま起動。必要であれば配布前に zip 化してください。
- **macOS**: `Gitcomi-darwin-x64/Gitcomi.app` を `/Applications` にコピーして実行。
- **Linux**: `Gitcomi-linux-x64/gitcomi` もしくは `Gitcomi-linux-x64/Gitcomi` を直接実行。配布前に `tar.gz` に固めておくと楽です。

これらのアーカイブは Node.js や Git を持っていない人でもすぐ使える実行イメージです。リポジトリを clone する必要はありません。
