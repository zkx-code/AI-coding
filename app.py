"""
记账工具 — Streamlit 主程序
侧边栏导航 + 4 个功能页面：添加账目、查看列表、删除账目、分类统计
"""
import streamlit as st
import pandas as pd
import plotly.express as px
from datetime import date

from config import CATEGORIES
from db import init_db, add, get_all, get_by_id, delete, get_available_months, get_stats

# ========== 页面配置 ==========
st.set_page_config(page_title="记账工具", page_icon="💰", layout="wide")

# ========== 应用启动：初始化数据库 ==========
init_db()

# ========== 侧边栏导航 ==========
st.sidebar.title("💰 记账工具")
page = st.sidebar.radio("导航", ["添加账目", "查看列表", "删除账目", "分类统计"], label_visibility="collapsed")
st.sidebar.divider()
st.sidebar.caption("数据存储在本地 data.db")

# ========== 页面 1：添加账目 ==========
def render_add_page():
    st.header("📝 添加账目")

    with st.form("add_form", clear_on_submit=True):
        col1, col2 = st.columns(2)
        with col1:
            amount = st.number_input("金额（元）", min_value=0.01, step=0.01, format="%.2f")
            category = st.selectbox("分类", CATEGORIES)
        with col2:
            record_date = st.date_input("日期", value=date.today())
            notes = st.text_input("备注（可选）", placeholder="例如：午餐、地铁通勤")

        submitted = st.form_submit_button("✅ 添加", type="primary", use_container_width=True)

        if submitted:
            if amount <= 0:
                st.error("金额必须大于 0")
            else:
                add(amount=amount, category=category, date=str(record_date), notes=notes.strip())
                st.success(f"已添加：{category} {amount:.2f} 元")
                st.rerun()


# ========== 页面 2：查看列表 ==========
def render_list_page():
    st.header("📋 查看列表")

    # 筛选条件
    col1, col2 = st.columns(2)
    with col1:
        months = get_available_months()
        all_month_label = "全部月份"
        month_options = [all_month_label] + months
        selected_month_label = st.selectbox("月份筛选", month_options)
        year_month = "" if selected_month_label == all_month_label else selected_month_label

    with col2:
        selected_categories = st.multiselect("分类筛选", CATEGORIES, default=[])

    # 查询数据
    records = get_all(year_month=year_month, categories=selected_categories if selected_categories else None)

    if not records:
        st.info("暂无数据，请先添加账目。")
        return

    # 转为 DataFrame 展示
    df = pd.DataFrame(records)
    df.columns = ["ID", "金额（元）", "分类", "日期", "备注"]

    # 汇总
    total_amount = df["金额（元）"].sum()
    st.metric(label="筛选结果总金额", value=f"¥ {total_amount:,.2f}")
    st.divider()

    st.dataframe(df, use_container_width=True, hide_index=True)


# ========== 页面 3：删除账目 ==========
def render_delete_page():
    st.header("🗑️ 删除账目")

    delete_id = st.number_input("输入要删除的账目 ID", min_value=1, step=1)

    if st.button("🔍 查询", type="secondary"):
        record = get_by_id(delete_id)
        if record is None:
            st.error(f"ID {delete_id} 不存在，请检查后重试。")
        else:
            st.session_state["delete_record"] = record

    # 如果之前查询到了记录，显示详情和确认删除按钮
    if "delete_record" in st.session_state:
        record = st.session_state["delete_record"]
        st.divider()
        st.write("**待删除的账目：**")
        st.json(record)

        if st.button("⚠️ 确认删除", type="primary"):
            success = delete(record["id"])
            if success:
                st.success(f"ID {record['id']} 已删除。")
                del st.session_state["delete_record"]
                st.rerun()
            else:
                st.error("删除失败，请重试。")


# ========== 页面 4：分类统计 ==========
def render_stats_page():
    st.header("📊 分类统计")

    # 月份筛选
    months = get_available_months()
    all_month_label = "全部月份"
    month_options = [all_month_label] + months
    selected_month_label = st.selectbox("月份筛选", month_options, key="stats_month")
    year_month = "" if selected_month_label == all_month_label else selected_month_label

    # 查询统计数据
    stats = get_stats(year_month=year_month)

    if not stats:
        st.info("暂无数据，请先添加账目。")
        return

    df = pd.DataFrame(stats)
    df.columns = ["分类", "总金额", "笔数"]
    total_all = df["总金额"].sum()
    df["占比"] = df["总金额"].apply(lambda x: f"{x / total_all * 100:.1f}%")

    # 柱状图
    fig = px.bar(
        df,
        x="分类",
        y="总金额",
        color="分类",
        text_auto=".2f",
        title=f"{selected_month_label} 各类别支出统计",
        color_discrete_sequence=px.colors.qualitative.Set2,
    )
    fig.update_layout(showlegend=False)
    st.plotly_chart(fig, use_container_width=True)

    # 统计表
    st.divider()
    st.subheader("统计明细")
    st.dataframe(df, use_container_width=True, hide_index=True)


# ========== 页面路由 ==========
if page == "添加账目":
    render_add_page()
elif page == "查看列表":
    render_list_page()
elif page == "删除账目":
    render_delete_page()
elif page == "分类统计":
    render_stats_page()
