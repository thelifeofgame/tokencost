#!/usr/bin/env bash
# 发布 TokenCostsAI 静态站点到生产目录 /srv/tokencostsai
#
# 用法：  ./publish.sh
#
# 背景：站点是 Next.js 纯静态导出（next.config.mjs 里 output: 'export'）。
#      生产环境由 Caddy 直接托管 /srv/tokencostsai，不需要任何 Node/Python 进程。
#      所以"发布"= 构建出 out/ 然后同步到 /srv/tokencostsai。
#
# 注意：不要在这里起 web server。Caddy 已经是 systemd 服务，改文件即生效。

set -euo pipefail
cd "$(dirname "$0")"

echo "[1/3] 构建静态站点 ..."
npm run build

if [ ! -f out/index.html ]; then
  echo "❌ 构建产物缺失：out/index.html 不存在" >&2
  exit 1
fi

echo "[2/3] 同步到 /srv/tokencostsai ..."
rsync -a --delete out/ /srv/tokencostsai/

echo "[3/3] 修正权限（Caddy 以 caddy 用户运行，文件必须可读）..."
chmod -R a+rX /srv/tokencostsai

echo
echo "✅ 发布完成"
echo "   文件数：$(find /srv/tokencostsai -type f | wc -l)"
echo "   体积：  $(du -sh /srv/tokencostsai | cut -f1)"
echo
echo "   自检：curl -sI http://127.0.0.1/ -H 'Host: tokencostsai.com' | head -1"
