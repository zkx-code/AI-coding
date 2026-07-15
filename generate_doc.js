const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, PageNumber, LevelFormat, TabStopType, TabStopPosition,
  TableOfContents, PageBreak
} = require("docx");

// ── 通用常量 ──
const PAGE_W = 12240, PAGE_H = 15840, MARGIN = 1440;
const CONTENT_W = PAGE_W - MARGIN * 2; // 9360
const ACCENT = "2E75B6";
const LIGHT_BG = "E8F0F8";
const BORDER_COLOR = "BBBBBB";
const border = { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR };
const borders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };
const headingFont = "Arial";
const bodyFont = "Arial";

// ── 工具函数 ──
function heading1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text, font: headingFont })] });
}
function heading2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text, font: headingFont })] });
}
function para(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120, line: 276 },
    ...opts,
    children: [new TextRun({ text, font: bodyFont, size: 21, ...opts.run })]
  });
}
function boldPara(label, text) {
  return new Paragraph({
    spacing: { after: 120, line: 276 },
    children: [
      new TextRun({ text: label, font: bodyFont, size: 21, bold: true }),
      new TextRun({ text, font: bodyFont, size: 21 }),
    ]
  });
}
function codeBlock(code) {
  return new Paragraph({
    spacing: { after: 80, line: 260 },
    shading: { fill: "F5F5F5", type: ShadingType.CLEAR },
    indent: { left: 360 },
    children: [new TextRun({ text: code, font: "Consolas", size: 18, color: "333333" })]
  });
}
function bullet(text, ref = "bullets") {
  return new Paragraph({
    numbering: { reference: ref, level: 0 },
    spacing: { after: 60 },
    children: [new TextRun({ text, font: bodyFont, size: 21 })]
  });
}
function makeHeaderCell(text, width) {
  return new TableCell({
    borders, width: { size: width, type: WidthType.DXA }, margins: cellMargins,
    shading: { fill: ACCENT, type: ShadingType.CLEAR },
    children: [new Paragraph({ children: [new TextRun({ text, font: bodyFont, size: 21, bold: true, color: "FFFFFF" })] })]
  });
}
function makeCell(text, width, opts = {}) {
  return new TableCell({
    borders, width: { size: width, type: WidthType.DXA }, margins: cellMargins,
    shading: opts.shading ? { fill: opts.shading, type: ShadingType.CLEAR } : undefined,
    children: [new Paragraph({ children: [new TextRun({ text, font: bodyFont, size: 21, ...opts.run })] })]
  });
}

// ── 构建文档 ──
const doc = new Document({
  styles: {
    default: { document: { run: { font: bodyFont, size: 21 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: headingFont, color: ACCENT },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: headingFont, color: "444444" },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: headingFont, color: "555555" },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 } },
    ]
  },
  numbering: {
    config: [
      { reference: "bullets",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  sections: [
    // ═══════ 封面页 ═══════
    {
      properties: {
        page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } }
      },
      children: [
        new Paragraph({ spacing: { before: 3600 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: "💰", size: 72 })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [new TextRun({ text: "finance_cil", font: headingFont, size: 56, bold: true, color: ACCENT })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: "Python Web 记账工具", font: headingFont, size: 36, color: "666666" })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          children: [new TextRun({ text: "项目文档", font: headingFont, size: 24, color: "999999" })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "2026-07-14", font: headingFont, size: 21, color: "AAAAAA" })]
        }),
      ]
    },

    // ═══════ 目录 + 正文 ═══════
    {
      properties: {
        page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } }
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: ACCENT, space: 4 } },
            children: [
              new TextRun({ text: "finance_cil", font: headingFont, size: 18, color: "999999" }),
              new TextRun({ text: "\t记账工具项目文档", font: headingFont, size: 18, color: "BBBBBB" }),
            ],
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          })],
        })
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            border: { top: { style: BorderStyle.SINGLE, size: 2, color: "DDDDDD", space: 4 } },
            children: [
              new TextRun({ text: "- ", font: bodyFont, size: 16, color: "999999" }),
              new TextRun({ children: [PageNumber.CURRENT], font: bodyFont, size: 16, color: "999999" }),
              new TextRun({ text: " -", font: bodyFont, size: 16, color: "999999" }),
            ],
          })],
        })
      },
      children: [

        // ── 目录 ──
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "目录", font: headingFont })] }),
        new TableOfContents("目录", { hyperlink: true, headingStyleRange: "1-3" }),
        new Paragraph({ children: [new PageBreak()] }),

        // ── 第1章：项目概述 ──
        heading1("1. 项目概述"),
        para("finance_cil 是一个基于 Python 的个人记账 Web 工具，使用 Streamlit 搭建前端界面，SQLite 作为后端数据库。支持添加账目、按月份和分类筛选查看、删除账目、以及分类统计图表等功能。"),
        para("项目面向有日常记账需求的个人用户，界面简洁直观，无需复杂配置，一个命令即可启动使用。"),

        boldPara("当前版本：", "v1.0"),
        boldPara("开发状态：", "功能完整，可投入使用"),

        // ── 第2章：技术栈 ──
        heading1("2. 技术栈"),

        new Table({
          width: { size: CONTENT_W, type: WidthType.DXA },
          columnWidths: [2800, 2000, 4560],
          rows: [
            new TableRow({ children: [
              makeHeaderCell("层级", 2800), makeHeaderCell("技术", 2000), makeHeaderCell("说明", 4560)
            ]}),
            new TableRow({ children: [
              makeCell("前端框架", 2800, { shading: LIGHT_BG }), makeCell("Streamlit", 2000, { shading: LIGHT_BG }),
              makeCell("Python Web 框架，适合数据应用和快速原型", 4560, { shading: LIGHT_BG })
            ]}),
            new TableRow({ children: [
              makeCell("数据库", 2800), makeCell("SQLite (sqlite3)", 2000),
              makeCell("Python 内置模块，零配置，单文件存储", 4560)
            ]}),
            new TableRow({ children: [
              makeCell("图表库", 2800, { shading: LIGHT_BG }), makeCell("Plotly Express", 2000, { shading: LIGHT_BG }),
              makeCell("交互式图表，支持柱状图、饼图等", 4560, { shading: LIGHT_BG })
            ]}),
            new TableRow({ children: [
              makeCell("数据处理", 2800), makeCell("Pandas", 2000),
              makeCell("DataFrame 结构，方便数据展示与聚合", 4560)
            ]}),
            new TableRow({ children: [
              makeCell("语言", 2800, { shading: LIGHT_BG }), makeCell("Python 3.12+", 2000, { shading: LIGHT_BG }),
              makeCell("类型注解、现代 Python 语法", 4560, { shading: LIGHT_BG })
            ]}),
          ]
        }),

        // ── 第3章：项目结构 ──
        heading1("3. 项目结构"),
        codeBlock("finance_cil/"),
        codeBlock("├── app.py            # Streamlit UI 主程序"),
        codeBlock("├── db.py             # 数据库操作模块"),
        codeBlock("├── config.py         # 常量配置"),
        codeBlock("├── requirements.txt  # Python 依赖"),
        codeBlock("└── data.db           # SQLite 数据库（自动生成）"),

        para("项目采用三层分离设计："),
        bullet("config.py — 集中管理预设分类、数据库路径等常量，易于维护"),
        bullet("db.py — 封装所有数据库操作，统一接口，方便替换数据库引擎"),
        bullet("app.py — Streamlit 页面渲染，只负责 UI 逻辑，调用 db.py 获取数据"),

        // ── 第4章：数据库设计 ──
        heading1("4. 数据库设计"),
        para("数据库采用 SQLite 单表设计，表名为 transactions，结构如下："),

        new Table({
          width: { size: CONTENT_W, type: WidthType.DXA },
          columnWidths: [1560, 2200, 1200, 4400],
          rows: [
            new TableRow({ children: [
              makeHeaderCell("字段", 1560), makeHeaderCell("类型", 2200),
              makeHeaderCell("约束", 1200), makeHeaderCell("说明", 4400)
            ]}),
            new TableRow({ children: [
              makeCell("id", 1560, { shading: LIGHT_BG }), makeCell("INTEGER", 2200, { shading: LIGHT_BG }),
              makeCell("PRIMARY KEY AUTOINCREMENT", 1200, { shading: LIGHT_BG }),
              makeCell("唯一标识，自增主键", 4400, { shading: LIGHT_BG })
            ]}),
            new TableRow({ children: [
              makeCell("amount", 1560), makeCell("REAL", 2200),
              makeCell("NOT NULL", 1200), makeCell("金额，必须 > 0", 4400)
            ]}),
            new TableRow({ children: [
              makeCell("category", 1560, { shading: LIGHT_BG }), makeCell("TEXT", 2200, { shading: LIGHT_BG }),
              makeCell("NOT NULL", 1200, { shading: LIGHT_BG }),
              makeCell("预设分类之一：餐饮、交通、购物、娱乐、居住、其他", 4400, { shading: LIGHT_BG })
            ]}),
            new TableRow({ children: [
              makeCell("date", 1560), makeCell("TEXT", 2200),
              makeCell("NOT NULL", 1200), makeCell("YYYY-MM-DD 格式日期", 4400)
            ]}),
            new TableRow({ children: [
              makeCell("notes", 1560, { shading: LIGHT_BG }), makeCell("TEXT", 2200, { shading: LIGHT_BG }),
              makeCell("DEFAULT ''", 1200, { shading: LIGHT_BG }),
              makeCell("备注信息（可选）", 4400, { shading: LIGHT_BG })
            ]}),
          ]
        }),
        para(""),
        para("预设分类共 6 个，覆盖日常记账场景：", { spacing: { after: 80 } }),
        codeBlock(`CATEGORIES = ["餐饮", "交通", "购物", "娱乐", "居住", "其他"]`),

        // ── 第5章：功能模块 ──
        heading1("5. 功能模块"),

        heading2("5.1 添加账目"),
        para("用户可通过表单录入一笔新的支出记录，包含以下字段："),
        bullet("金额（元）— 数字输入，精度到分，最小值为 0.01"),
        bullet("分类 — 下拉选择，6 个预设分类之一"),
        bullet("日期 — 日期选择器，默认今天"),
        bullet("备注 — 可选文本，如「午餐」「地铁通勤」"),
        para("提交后数据写入 SQLite，页面自动刷新。金额 ≤ 0 时前端拦截并提示错误。"),

        heading2("5.2 查看列表"),
        para("以表格形式展示所有账目记录，支持双重筛选："),
        bullet("月份筛选 — 下拉列出所有有记录的月份（从数据库中动态获取）"),
        bullet("分类筛选 — 多选下拉，可同时查看多个分类"),
        para("筛选结果上方显示合计金额（¥ x,xxx.xx 格式），下方以 DataFrame 表格展示明细，按日期和 ID 倒序排列。"),

        heading2("5.3 删除账目"),
        para("两步操作防止误删："),
        bullet("输入 ID → 点击「查询」→ 展示该记录的 JSON 详情"),
        bullet("确认无误 → 点击「确认删除」→ 从数据库移除"),
        para("ID 不存在时给出明确提示，删除成功后自动清空确认状态并刷新。"),

        heading2("5.4 分类统计"),
        para("按分类汇总支出数据，双重呈现："),
        bullet("柱状图 — 使用 Plotly Express 生成交互式图表，展示各类别总金额对比"),
        bullet("统计明细表 — 列出分类、总金额、笔数、占比（百分比）"),
        para("支持月份筛选（同查看列表），筛选后图表和表格同步更新。"),

        // ── 第6章：运行指南 ──
        heading1("6. 运行指南"),

        heading2("6.1 环境要求"),
        bullet("Python 3.10+"),
        bullet("pip 包管理器"),

        heading2("6.2 安装与启动"),
        para("安装依赖", { run: { bold: true } }),
        codeBlock("pip install -r requirements.txt"),
        para("启动应用", { run: { bold: true } }),
        codeBlock("streamlit run app.py"),
        para("启动后在浏览器访问 http://localhost:8501 即可使用。"),

        heading2("6.3 注意事项"),
        bullet("数据库文件 data.db 自动生成于项目根目录，请不要提交到 Git"),
        bullet("金额必须 > 0，分类必须是 6 个预设值之一"),
        bullet("所有数据库操作通过 db.py 模块完成，前端不直接操作数据库"),
        bullet("SQLite 使用 WAL 模式提升并发性能"),

        // ── 第7章：模块 API 说明 ──
        heading1("7. 模块 API 说明"),

        heading2("7.1 db.py 数据库接口"),
        new Table({
          width: { size: CONTENT_W, type: WidthType.DXA },
          columnWidths: [3400, 2400, 3560],
          rows: [
            new TableRow({ children: [
              makeHeaderCell("函数", 3400), makeHeaderCell("参数", 2400), makeHeaderCell("返回", 3560)
            ]}),
            ...[
              ["init_db()", "—", "创建 transactions 表（如不存在）"],
              ["add(amount, category, date, notes)", "金额、分类、日期、备注", "—"],
              ["get_all(year_month, categories)", "可选：月份(YYYY-MM)、分类列表", "list[dict] 按日期倒序"],
              ["get_by_id(id)", "记录 ID", "dict | None"],
              ["delete(id)", "记录 ID", "bool 是否成功"],
              ["get_available_months()", "—", "list[str] 月份列表，降序"],
              ["get_stats(year_month)", "可选：月份(YYYY-MM)", "list[dict] 分类汇总"],
            ].map((row, i) => {
              const bg = i % 2 === 1 ? { shading: LIGHT_BG } : {};
              return new TableRow({ children: [
                makeCell(row[0], 3400, bg), makeCell(row[1], 2400, bg), makeCell(row[2], 3560, bg)
              ]});
            }),
          ]
        }),

        heading2("7.2 config.py 常量"),
        new Table({
          width: { size: CONTENT_W, type: WidthType.DXA },
          columnWidths: [2600, 3000, 3760],
          rows: [
            new TableRow({ children: [
              makeHeaderCell("常量", 2600), makeHeaderCell("值", 3000), makeHeaderCell("说明", 3760)
            ]}),
            new TableRow({ children: [
              makeCell("CATEGORIES", 2600, { shading: LIGHT_BG }),
              makeCell("[\"餐饮\",\"交通\",\"购物\",\"娱乐\",\"居住\",\"其他\"]", 3000, { shading: LIGHT_BG }),
              makeCell("预设支出分类列表", 3760, { shading: LIGHT_BG })
            ]}),
            new TableRow({ children: [
              makeCell("DB_PATH", 2600),
              makeCell("\"data.db\"", 3000),
              makeCell("SQLite 数据库文件路径", 3760)
            ]}),
          ]
        }),

        // ── 第8章：扩展建议 ──
        heading1("8. 扩展建议"),
        para("以下是未来可扩展的功能方向："),
        bullet("用户认证 — 支持多用户独立记账"),
        bullet("预算管理 — 设置月度预算，超支提醒"),
        bullet("导出报表 — 支持导出为 CSV、PDF 格式"),
        bullet("收入记录 — 当前仅支持支出，可扩展为收支双模式"),
        bullet("标签系统 — 在预设分类外增加自定义标签"),
        bullet("数据备份 — 一键备份/恢复数据库到云端"),
        bullet("移动端适配 — 优化 Streamlit 在手机端的显示效果"),

        new Paragraph({ spacing: { before: 400 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 2, color: "DDDDDD", space: 8 } },
          spacing: { before: 200 },
          children: [new TextRun({ text: "— 文档结束 —", font: bodyFont, size: 18, color: "AAAAAA", italics: true })]
        }),
      ]
    }
  ]
});

// ── 输出 ──
Packer.toBuffer(doc).then(buf => {
  const out = "e:/Claude code/finance_cil/finance_cil_项目文档.docx";
  fs.writeFileSync(out, buf);
  console.log("OK: " + out);
});
