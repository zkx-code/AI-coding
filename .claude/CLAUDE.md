# 项目名称
finance_cil

## 项目概述
Python Web 记账工具，支持添加账目、按月份和分类筛选查看、删除账目、分类统计图表。

## 技术栈
- 前端：Streamlit（Python Web 框架）
- 后端：Python 内置 sqlite3
- 图表：Plotly Express
- 数据处理：Pandas

## 项目结构
```
finance_cil/
├── app.py            # Streamlit UI：侧边栏导航 + 4 个页面渲染
├── db.py             # 数据库操作：建表、CRUD、统计查询
├── config.py         # 常量：预设分类、数据库路径
├── requirements.txt  # 依赖
└── data.db           # SQLite 数据库（自动生成，不提交到 Git）
```

## 编码规范
- 函数名使用 snake_case 命名
- 数据库操作统一通过 db.py 模块调用
- Streamlit 页面渲染函数以 render_ 前缀命名
- 中文注释，面向编程新手

## 数据库设计

单表 transactions：

| 字段 | 类型 | 约束 |
|------|------|------|
| id | INTEGER PRIMARY KEY AUTOINCREMENT | 自增主键 |
| amount | REAL NOT NULL | 金额（>0） |
| category | TEXT NOT NULL | 预设分类之一 |
| date | TEXT NOT NULL | YYYY-MM-DD |
| notes | TEXT DEFAULT '' | 备注 |

预设分类：餐饮、交通、购物、娱乐、居住、其他

## 注意事项
- data.db 不提交到 Git
- 金额必须 > 0，分类必须是预设值之一
- 日期格式统一为 YYYY-MM-DD
