# 部署流程说明 (Deploy Workflow)

本项目使用 GitHub Actions 自动部署纯静态祈福签页面到 GitHub Pages 和 Cloudflare Pages。

> **注意**：该工作流默认只在该仓库的 `main` 分支上触发。

## 📋 触发机制 (Trigger)

为了节省资源，自动化部署**不仅**需要推送到 `main` 分支，还需要在 **Commit Message（提交信息）** 中包含特定关键词。

| 关键词 | 说明 | 触发动作 |
| :--- | :--- | :--- |
| `deploy` | 部署页面 | ✅ 触发 GitHub Pages 部署<br>✅ 触发 Cloudflare Pages 部署 |

**示例 Commit：**
```bash
git commit -m "feat: add canvas API support (deploy)"
git commit -m "fix: update color mapping (deploy)"
```

如果提交信息中**不包含** `deploy`，GitHub Action 将**不会运行**。

## 🚀 前置准备：手动创建 Cloudflare 项目 (重要)

由于使用的是 API Token 推送模式，你需要先在 Cloudflare 后台手动创建一个同名的 **Direct Upload** 类型项目，否则 Action 会报 `Project not found` 错误。

### 创建步骤：

1. 进入 [Cloudflare Dashboard](https://dash.cloudflare.com/) -> **Workers & Pages**。
2. 点击 **Create application** (创建应用)。
3. 在创建页面中，**不要**直接连接 GitHub，请选择标签页 **Pages**。
4. **关键步骤：** 点击 **Upload assets** (上传资产) 或者 **Upload your static files** (上传静态文件)。
   > _提示：该选项可能位于页面底部，或者在 Connect GitHub 下方。确保选择的是 Direct Upload 模式。_
5. 输入项目名称：`skyblessings-static` (必须与 `deploy.yml` 中的 `projectName` 配置一致)。
6. 点击 **Create project** 完成创建。
   - ❤️ **推荐做法**：找个空文件夹（如 `temp`），里面新建一个 `index.html` (写个 "Hello" 即可)，拖进去点 **Deploy site** 完成"占位"。
   - 只要项目创建成功，后续的 GitHub Action 会自动覆盖这里的内容，不用担心。
7. 回到 GitHub Actions 页面，**重新运行 (Re-run)** 之前失败的任务。

## 🛠️ 部署逻辑

该工作流包含两个并行的任务 (Jobs)，分别部署到两个平台：

### 1. GitHub Pages
- **部署内容**：整个仓库根目录（纯静态文件）
- **访问地址**：`https://你的用户名.github.io/仓库名/`
- **部署方式**：使用 `actions/deploy-pages`

### 2. Cloudflare Pages
- **部署内容**：整个仓库根目录（纯静态文件）
- **访问地址**：`https://skyblessings-static.pages.dev` 或自定义域名
- **部署方式**：使用 `cloudflare/pages-action`

> **说明**：由于是纯静态项目，无需构建步骤，直接上传所有文件即可。

## 🔑 需要配置的 Secrets

为了使 Cloudflare Pages 部署成功，需要在 GitHub 仓库的 **Settings -> Secrets and variables -> Actions** 中添加以下 Secrets：

### 配置步骤：

1. 进入你的 GitHub 仓库
2. 点击 **Settings** (设置)
3. 左侧菜单找到 **Secrets and variables** -> **Actions**
4. 点击 **New repository secret** 添加以下两个 Secret：

| Secret Name | 说明 | 获取方式 |
| :--- | :--- | :--- |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API 令牌 | **获取步骤：**<br>1. 访问 [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)<br>2. 点击 **Create Token**<br>3. 模板选择 **Edit Cloudflare Workers**<br>4. **权限 (Permissions)** 确保包含：<br>   - `Account` - `Cloudflare Pages` - `Edit` ✅ (必需)<br>5. **账户资源 (Account Resources)**:<br>   - 选择 `Include` -> `你的账户名`<br>6. **区域资源 (Zone Resources)**:<br>   - 选择 `All zones` (所有区域)<br>7. 点击 **Continue to summary** 并生成 Token<br>8. **复制生成的 Token**（只显示一次，请妥善保存）<br>9. 回到 GitHub，粘贴到 `CLOUDFLARE_API_TOKEN` |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 账户 ID | **获取步骤：**<br>1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)<br>2. 点击任意域名/站点（或直接进入 Workers & Pages）<br>3. 在右侧栏找到 **Account ID**<br>4. 点击复制按钮<br>5. 回到 GitHub，粘贴到 `CLOUDFLARE_ACCOUNT_ID` |

### 添加 Secret 的详细步骤：

1. 在 GitHub 仓库页面，点击 **Settings**
2. 左侧菜单：**Secrets and variables** -> **Actions**
3. 点击 **New repository secret**
4. **Name** 填写：`CLOUDFLARE_API_TOKEN`
5. **Secret** 粘贴你从 Cloudflare 获取的 API Token
6. 点击 **Add secret**
7. 重复步骤 3-6，添加 `CLOUDFLARE_ACCOUNT_ID`

## ⚙️ 配置文件说明

如果需要修改 Cloudflare Pages 的项目名称，请编辑 `.github/workflows/deploy.yml` 文件中的 `projectName` 字段：

```yaml
      - name: Publish to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          # ...
          projectName: skyblessings-static # 👈 修改这里为你在 Cloudflare 创建的项目名
```

## 🎯 使用示例

### 部署新版本：

```bash
# 修改代码后
git add .
git commit -m "feat: add new feature (deploy)"
git push origin main
```

### 不触发部署：

```bash
# 只是修复文档或小改动
git add .
git commit -m "docs: update README"
git push origin main
```

## 📝 API 使用说明

部署成功后，你的静态页面将支持以下 API 模式：

### GitHub Pages 访问：
```
https://你的用户名.github.io/仓库名/
https://你的用户名.github.io/仓库名/?a=test&b=123
https://你的用户名.github.io/仓库名/?a=玩家名&b=2026-04-08&font=simli
```

### Cloudflare Pages 访问：
```
https://skyblessings-static.pages.dev/
https://skyblessings-static.pages.dev/?a=test&b=123
https://skyblessings-static.pages.dev/?a=玩家名&b=2026-04-08&font=simli
```

### 支持的参数：

| 参数 | 说明 | 示例 |
| :--- | :--- | :--- |
| `a`, `b`, `c`, `d`, `e` | 种子参数（任意组合，固定结果） | `?a=玩家名&b=2026-04-08` |
| `font` | 字体选择：`lxgw`（默认）/ `simli` | `?font=simli` |

## 🔍 故障排查

### 1. Cloudflare 部署失败：`Project not found`
- **原因**：未在 Cloudflare 后台手动创建项目
- **解决**：按照上面的"前置准备"步骤创建项目

### 2. Cloudflare 部署失败：`Authentication error`
- **原因**：API Token 或 Account ID 配置错误
- **解决**：检查 GitHub Secrets 中的配置是否正确

### 3. GitHub Pages 404 错误
- **原因**：可能需要在仓库设置中启用 GitHub Pages
- **解决**：Settings -> Pages -> Source 选择 "GitHub Actions"

### 4. 推送后没有触发部署
- **原因**：Commit Message 中没有包含 `deploy` 关键词
- **解决**：重新提交，确保消息中包含 `deploy`

---

## 📚 相关链接

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Cloudflare Pages Action](https://github.com/cloudflare/pages-action)
