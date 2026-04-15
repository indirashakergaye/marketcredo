#!/bin/bash
# Auto-deploy to Vercel when site files (html/css/js) are edited
FILE=$(python -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('file_path','') or d.get('tool_response',{}).get('filePath',''))")
if echo "$FILE" | grep -qiE '\.(html|css|js)$'; then
  cd "C:/Users/HOME/Documents/Marketcredo" && vercel --prod --yes > /dev/null 2>&1
fi
