import gradio as gr
import os
from pathlib import Path

# 设置静态文件目录
STATIC_DIR = Path("./dist")

def create_app():
    # 读取并修改 index.html
    index_path = STATIC_DIR / "index.html"
    
    if index_path.exists():
        with open(index_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
        
        # 修复所有资源路径
        html_content = html_content.replace('href="/favicon.ico"', 'href="./favicon.ico"')
        html_content = html_content.replace('src="/assets/', 'src="./assets/')
        html_content = html_content.replace('href="/assets/', 'href="./assets/')
        
        # 为了在 Gradio 中正确加载，我们需要读取并内联关键的 CSS
        css_files = []
        try:
            # 查找 CSS 文件
            for css_file in STATIC_DIR.glob("assets/*.css"):
                if css_file.name.startswith("index-"):
                    with open(css_file, 'r', encoding='utf-8') as f:
                        css_content = f.read()
                        css_files.append(css_content)
        except Exception as e:
            print(f"读取 CSS 文件错误: {e}")
        
        # 将 CSS 内联到 HTML 中
        if css_files:
            css_inline = f"<style>{''.join(css_files)}</style>"
            html_content = html_content.replace('</head>', f'{css_inline}</head>')
        
    else:
        html_content = """
        <div style="text-align: center; padding: 50px;">
            <h1>国网故障诊断系统</h1>
            <p>系统文件未找到，请检查构建是否成功</p>
        </div>
        """
    
    # 创建 Gradio 界面
    with gr.Blocks(
        title="国网故障诊断系统",
        theme=gr.themes.Default(),
        css="""
        .gradio-container {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
        }
        .main {
            max-width: 100% !important;
            padding: 0 !important;
        }
        .block {
            border: none !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
        }
        iframe {
            width: 100% !important;
            height: 100vh !important;
            border: none !important;
        }
        """
    ) as demo:
        
        # 添加静态文件服务的说明
        gr.Markdown("""
        ## 国网故障诊断系统
        
        **注意**: 由于 Gradio 的限制，Vue SPA 应用无法在此环境中完全运行。
        
        ### 建议的部署方案：
        1. **Netlify**: 直接上传 `dist` 文件夹
        2. **Vercel**: 连接 GitHub 仓库自动部署
        3. **GitHub Pages**: 启用 Pages 功能
        4. **传统服务器**: 使用 Nginx/Apache 托管静态文件
        
        ### 项目特性：
        - 🧠 智能逻辑门诊断
        - 🔬 多维故障分析  
        - 📊 专业可视化
        - 🖼️ 图像AI诊断
        - 🗃️ 故障树管理
        
        如需查看完整功能，请下载项目并在本地运行：
        ```bash
        npm run dev
        ```
        """)
        
        # 尝试显示 HTML 内容（有限功能）
        gr.HTML(
            value=html_content,
            show_label=False,
            elem_id="app-container"
        )
    
    return demo

# 启动应用
if __name__ == "__main__":
    app = create_app()
    app.launch(
        server_name="0.0.0.0",
        server_port=7860,
        share=False,
        show_error=True
    )