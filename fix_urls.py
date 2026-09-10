import os
import re

fe_src = r'd:\Yuva-factory\Yuva-factory\yuva-factory-FE\src'
for root, _, files in os.walk(fe_src):
    for f in files:
        if f.endswith(('.jsx', '.js')):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as file:
                content = file.read()
            # Replace localhost URLs with environment variable fallback
            new_content = re.sub(r'\"http://localhost:5000(/api)?', r'(process.env.REACT_APP_API_URL || "http://localhost:5000") + "\1', content)
            new_content = re.sub(r'\'http://localhost:5000(/api)?', r'(process.env.REACT_APP_API_URL || "http://localhost:5000") + \'\1', new_content)
            new_content = re.sub(r'\`http://localhost:5000(/api)?', r'${process.env.REACT_APP_API_URL || "http://localhost:5000"}\1', new_content)
            new_content = re.sub(r'\"http://127\.0\.0\.1:5000(/api)?', r'(process.env.REACT_APP_API_URL || "http://localhost:5000") + "\1', new_content)
            new_content = re.sub(r'\'http://127\.0\.0\.1:5000(/api)?', r'(process.env.REACT_APP_API_URL || "http://localhost:5000") + \'\1', new_content)
            new_content = re.sub(r'\`http://127\.0\.0\.1:5000(/api)?', r'${process.env.REACT_APP_API_URL || "http://localhost:5000"}\1', new_content)
            if new_content != content:
                with open(path, 'w', encoding='utf-8') as file:
                    file.write(new_content)
print('Done')
