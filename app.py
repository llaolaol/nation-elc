import gradio as gr
import os
import mimetypes
from pathlib import Path

# 设置静态文件目录
STATIC_DIR = Path("./dist")

def serve_static_file(path: str = ""):
    """服务静态文件"""
    if not path:
        path = "index.html"
    
    file_path = STATIC_DIR / path
    
    # 安全检查：确保文件在 dist 目录内
    try:
        file_path = file_path.resolve()
        STATIC_DIR.resolve()
        if not str(file_path).startswith(str(STATIC_DIR.resolve())):
            return "访问被拒绝"
    except:
        return "文件未找到"
    
    # 检查文件是否存在
    if not file_path.exists():
        return "文件未找到"
    
    # 读取并返回文件内容
    try:
        if file_path.suffix in ['.html', '.css', '.js', '.json']:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            return content
        else:
            # 对于二进制文件，返回文件路径
            return str(file_path)
    except Exception as e:
        return f"读取文件错误: {str(e)}"

# 创建 Gradio 应用
def create_app():
    # 读取主页内容
    index_path = STATIC_DIR / "index.html"
    if index_path.exists():
        with open(index_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
        
        # 修复资源路径
        html_content = html_content.replace('href="/assets/', 'href="./assets/')
        html_content = html_content.replace('src="/assets/', 'src="./assets/')
    else:
        html_content = "<h1>国网故障诊断系统</h1><p>系统正在加载中...</p>"
    
    with gr.Blocks(
        title="国网故障诊断系统",
        theme=gr.themes.Default(),
        css="""
        .gradio-container {
            max-width: 100% !important;
            padding: 0 !important;
        }
        .main {
            max-width: 100% !important;
        }
        """
    ) as demo:
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