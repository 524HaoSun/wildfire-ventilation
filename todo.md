# CAVE 16:9 Redesign

- [x] 阅读并提炼 Finesse Skill 的设计流程与约束
- [x] 审计当前五屏在 16:9 下的排版、对齐、字号和密度问题
- [x] 在 ideas.md 中记录新版 16:9 设计系统与 entering page 方案
- [x] 新增具有叙事感的 entering page，并提供明确进入工作台的动作
- [x] 建立严格的 16:9 舞台、缩放与安全边距系统
- [x] 重构全局字体层级、栅格、基线、面板和标注样式
- [x] 逐屏修正 Challenge、Design、Run、Analyse、Extend 的构图与对齐
- [x] 在 1920×1080 与 1440×810 视口完成视觉检查
- [x] 回归测试键盘导航、持久化状态、计算引擎与生产构建
- [x] 保存新版检查点并交付改版摘要

## Product-level 3D and UX Rebuild

- [x] 逐屏记录 1920×1080 与 1440×810 下的空白、重叠、裁切和滚动问题
- [x] 梳理 Challenge → Design → Run → Analyse → Extend 的主任务与页面层级
- [x] 重新选择本地打包的软件界面字体与展示字体
- [x] 删除 Screen 5、Extend 导航与所有未来工作/机器学习内容
- [x] 将产品逻辑重写为 Challenge → Design → Run → Analyse 四屏闭环
- [x] 在 engine 中实现可解释的场景通风建议、三阶段动作与三项权衡纯函数
- [x] 为通风指导函数补充 Vitest 单元测试与温度/场景边界测试
- [x] 将 Analyse 第四面板升级为 Ventilation Guidance 决策模块
- [x] 审核所有数据元素的 MEASURED、MODEL PREDICTION、CAVE 或 ILLUSTRATIVE 来源标识
- [x] 验证生产构建不发起 CDN、Google Fonts 或外部数据请求
- [x] 编写四分钟演示说明、README 运行说明和逐项自检报告
- [x] 生成或选择与 CAVE 实验建筑一致的高质量视觉资源
- [x] 为 Single-room 建立独立可旋转、缩放、重置的 3D 场景
- [x] 为 Two-storey 建立独立可旋转、缩放、重置的 3D 场景
- [x] 为 Bus 建立独立可旋转、缩放、重置的 3D 场景
- [x] 让三种建筑切换联动结构、传感器、体积、参数与模型说明
- [x] 重构 Design 页面，清晰区分配置、3D 视图和预测结果
- [x] 修复四屏的满屏占用、文字重叠、面板裁切和视觉层级
- [x] 升级关键按钮、悬停、焦点、拖拽、旋转与加载反馈
- [x] 在两个 16:9 视口逐屏验收，并验证三种 3D 模型的全部交互
- [x] 运行科学测试、TypeScript 检查和生产构建
- [x] 保存产品级重构检查点并交付新版
- [x] 为进入页实现可跳过、可重看的 3.5 秒仪器启动序列与手动 ENTER
- [x] 用本地 SVG/CSS 实现 20–30 秒慢速环境烟雾、示意图自绘和逐行启动读数
- [x] 为 Challenge 的纽约烟霾与伦敦热浪加入不超过 8% 的语义色洗和真实背景说明
- [x] 让 Run 的外部 CAVE 空间随实测烟峰改变烟雾密度，内部建筑保持冷静无烟
- [x] 保证 Design、Analyse、内部建筑和计算图表完全不出现烟雾/火焰视觉
- [x] 为所有氛围动画实现 prefers-reduced-motion 静态回退且不阻塞主线程

## Attachment review and continuation

- [x] 审阅 pasted_content_3.txt，并提炼明确需求、约束、优先级与潜在问题
- [x] 将附件要求与当前四屏 CAVE 实现逐项对照并记录差距
- [x] 按附件要求修改界面、交互、计算逻辑或交付文档
- [x] 运行 TypeScript、科学测试与生产构建验证
- [x] 在 1920×1080 与 1440×810 完成本轮视觉复核
- [x] 保存最终检查点并交付需求摘要、修改说明与问题清单

## User-directed visual rebuild

- [x] 审计当前字体、信息密度、页面构图与进入页状态，记录逐屏问题
- [x] 以 Times New Roman 风格的高对比衬线字体重建标题与科学报告排版系统
- [x] 重构 Challenge、Design、Run、Analyse 的 16:9 空间分配，消除拥挤与怪异留白
- [x] 恢复并精修 Entering page，确保首次进入与手动重播均可见
- [x] 重做 Single-room 的可信 2D 剖面、3D 结构、材质与传感器布置
- [x] 重做 Two-storey 的可信 2D 剖面、3D 结构、材质与传感器布置
- [x] 重做 Bus 的可信 2D 剖面、3D 结构、材质与传感器布置
- [x] 统一真实设备尺度、HVAC、门窗、风管、传感器支架、标签和选中状态
- [x] 运行科学测试、TypeScript 检查与生产构建
- [x] 在 1920×1080 和 1440×810 完成四屏与进入页视觉验收
- [x] 保存整体重构检查点并交付前后变化摘要

## Blank-page recovery

- [x] 从 Entering page 点击 Enter workbench 复现空白页
- [x] 检查浏览器控制台、路由参数、离场状态与渲染边界
- [x] 修复 effect 清理提前取消进入计时器的根因，并加入稳定回调与重复触发保护
- [x] 逐一验证 Challenge、Design、Run、Analyse 及顶部导航
- [x] 验证 Single-room、Two-storey、Bus 的 Section 与 3D 切换
- [x] 运行科学测试、TypeScript 检查和生产构建
- [x] 在 1440×810 与 1920×1080 验证进入路径和四屏渲染
- [x] 保存空白页修复检查点并交付

## Published blank-stage recovery

- [x] 在 caveworkbench-ditoofhq.manus.space 从 Entering page 复现空白纸张舞台
- [x] 对比预览域名与发布域名的 URL、DOM、CSS 动画状态和运行日志
- [x] 定位为启动序列对核心内容延迟透明隐藏且入口缺少浏览器原生导航兜底
- [x] 修复后通过鼠标点击与 Enter 键分别进入 Challenge
- [x] 在发布域名逐一验证 Challenge、Design、Run、Analyse
- [x] 运行测试、TypeScript 检查与生产构建
- [x] 保存并自动发布最终修复检查点

## Root-domain cold-start recovery

- [x] 使用无查询参数的 https://caveworkbench-ditoofhq.manus.space/ 冷启动复现
- [x] 检查正式根域名实际返回的 HTML、JavaScript 文件指纹与缓存响应头
- [x] 检查 Service Worker、浏览器缓存、本地存储、运行时异常和根节点 DOM
- [x] 将进入路径改为不依赖启动动画、计时器或历史客户端状态的确定性导航
- [x] 运行测试、TypeScript 检查与生产构建
- [x] 发布后在无参数正式根域名连续冷启动与硬刷新至少三次
- [x] 分别验证鼠标点击、Enter 键和直接 screen=1 导航
- [x] 逐一验证 Challenge、Design、Run、Analyse 并保存最终检查点

## Run / Analyse spacing and global typography repair

- [x] 审计 Run 页回放控制、空间重建、图表和底部指标在 1920×1080 与 1440×810 下的拥挤、重叠与裁切
- [x] 重构 Run 页纵向分区，分离播放控制、时间轴、空间重建、响应图表与底部指标
- [x] 审计 Analyse 页 Ventilation Guidance 的建议摘要、三阶段卡片、权衡指标、规则图与页脚间距
- [x] 重构 Ventilation Guidance，使三阶段动作、指标行、规则图和页脚拥有稳定且不重叠的高度
- [x] 将全应用标题、正文、按钮、数字、微型标签、图表标注和输入控件统一为 Times New Roman
- [x] 移除 HTML 与 CSS 中的外部字体引用及所有 mono/sans/serif 字体覆盖
- [x] 在 1920×1080 与 1440×810 逐屏检查 Challenge、Design、Run、Analyse 的排版和字体一致性
- [x] 运行科学测试、TypeScript 检查和生产构建
- [x] 保存检查点、自动发布并在正式域名验证 Run 与 Analyse

## PM₂.₅ unit and single-window control correction

- [x] 全局扫描页面、SVG、图表、3D 标签、计划表和导出文本中的 mg/M³、MG/M³、mg/m³ 及错误大小写
- [x] 将所有 PM₂.₅ 质量浓度统一为科学正确的 µg/m³，保留 CO₂ 的 ppm、温度的 °C 和相对湿度的 %
- [x] 审计 Challenge 双滑块的数据语义、状态字段和窗口统计依赖
- [x] 将起止双滑块重构为一个单日时间窗口滑块，并同步窗口高亮、时间戳、峰值和后续实验输入
- [x] 在 Challenge、Design、Run、Analyse 检查单位与窗口状态一致性
- [x] 在 1440×810 与 1920×1080 验证单滑块布局、键盘可达性和无重叠
- [x] 运行科学测试、TypeScript 检查与生产构建
- [x] 保存检查点、自动发布并在正式域名验证单位与单滑块

### Validation note

1440×810 与 1920×1080 的四屏截图均显示 PM₂.₅ 纵轴为 `µg/m³`；Challenge 仅保留一个固定 24 小时时间窗滑块，图中高亮范围、时间戳、目标剖面与后续实验状态保持同步。10 项科学测试、TypeScript 检查和生产构建全部通过。

正式域名验证：`https://caveworkbench-ditoofhq.manus.space/?direct=1&screen=1&v=62e55f2f` 已显示 `Target window 24 h`、唯一的 `event-day-window` 控件以及 `PM₂.₅ (µg/m³)`；无版本参数的首次访问曾命中旧缓存，加入检查点参数后已确认新部署成功传播。

## System-wide UI redesign and Challenge curation

- [ ] 读取现有专业 UI 设计技能与项目设计规范，确定本轮重设计方法
- [ ] 在 1440×810 与 1920×1080 逐屏审计字体大小、颜色对比、数字尺度、标题大小写、间距、对齐和卡片一致性
- [ ] 重建全局字体层级，消除过小标题、过浅文字、无意义全大写和失控的大数字
- [ ] 重建全局色彩系统，统一纸张、墨色、强调色、状态色、图表色和交互态
- [x] 将 Challenge 收敛为 New York 2023 与 London 2022 两项互补边界条件
- [x] 统一 Event Explorer 两个案例卡片的背景、边框、选中态、来源标签和信息密度
- [ ] 重构 Challenge 主图、单日滑块、指标带和目标剖面的视觉层级
- [ ] 逐屏统一 Design、Run、Analyse 的标题、面板、标签、数字、图表和按钮
- [ ] 检查所有 hover、focus、selected、disabled、empty 和响应式状态
- [ ] 在 1440×810 与 1920×1080 完成四屏视觉验收和样式审查
- [ ] 运行科学测试、TypeScript 检查与生产构建
- [ ] 保存检查点、自动发布并在正式域名验证四屏

## London 2023 case removal

- [x] 定位所有 London 2023 标识符、数据集、界面文案、样式选择器与测试引用
- [x] 删除 London 2023，同时保持 New York 2023 与 London 2022 的模型路径完整
- [x] 将 Challenge 重排为平衡的双案例选择器，并保持 Event Explorer 表面一致
- [x] 检查 Design、Run、Analyse、计划表和持久化状态中是否残留旧引用
- [x] 运行 TypeScript、科学测试、生产构建与双分辨率视觉复核
- [x] 保存并自动发布精简后的检查点

## Information hierarchy and Run compaction

- [x] 逐屏把信息划分为必须常显、可折叠与可删除三类并记录精简依据
- [x] 删除重复的来源、方法、状态与解释文案，保留可追溯性但减少视觉竞争
- [x] 缩小 Run 空间重建区，将当前时刻、关键传感器、策略差异与响应曲线提升为主证据
- [x] 重排 Run 播放控制、时间轴、空间视图、传感器、响应图和摘要指标的比例
- [x] 检查 Challenge、Design、Analyse 是否存在同类冗余并进行一致性精简
- [x] 在 1440×810 与 1920×1080 验证信息密度、可读性、无裁切和完整流程
- [x] 运行 TypeScript、科学测试与生产构建
- [x] 保存并自动发布精简版本

## Ventilation Guidance clarity rebuild

- [x] 审计建议摘要、三阶段行动、指标、规则图和连接线的结构与重叠根因
- [x] 删除无信息价值的装饰线和重复说明，明确从建议到行动再到权衡的阅读顺序
- [x] 将三阶段行动重构为稳定的阶段、触发条件、动作和目标结构
- [x] 精简并校对全部英文文案，避免含混术语和超长句
- [x] 重排权衡指标与规则证据，确保数字、单位、标签和解释不重叠
- [x] 在 1440×810 与 1920×1080 验证 Analyse 页面无裁切、无重叠且层级清晰
- [x] 运行 TypeScript、科学测试与生产构建
- [x] 保存并自动发布 Ventilation Guidance 修复版本

## Evidence-driven interaction and scroll-state upgrade

- [x] 审计四屏共享状态、图表时间轴、传感器选择、Guidance、Trade-off、导出与当前滚动行为
- [x] 建立跨 Challenge、Design、Run、Analyse 保持的时间光标与传感器选择状态
- [x] 点击 Before / During / After peak 时同步高亮对应时间区间、外部峰值与室内响应
- [x] 悬停策略条形图时预览对应预测曲线，点击后锁定比较方案
- [x] 点击 Trade-off 指标时展开计算依据、输入值、公式说明与来源
- [x] 增加 What changes this recommendation? 规则抽屉与安全范围内的轻量调参
- [x] 让调参实时更新推荐、阶段动作、权衡指标与策略证据
- [x] 增加可编辑 Decision Note，并随分析包导出当前事件、策略、证据与限制
- [x] 将滚动改为驱动实际阶段状态、图表强调与叙事内容变化，而非仅做位移动画
- [x] 为全部新增交互补充键盘操作、焦点态、减少动态偏好与无动画回退
- [x] 在 New York 2023 与 London 2022 两个案例验证长文案、阈值冲突与推荐变化
- [x] 在 1440×810 与 1920×1080 验证无重叠、无裁切、交互反馈清晰
- [x] 运行 TypeScript、科学测试、生产构建与浏览器交互回归
- [x] 保存检查点、自动发布并在正式域名验证核心交互

## Full-workbench chart, table and typography readability repair

- [ ] 在 1440×810 与 1920×1080 逐页截取 Challenge、Design、Run、Analyse 当前状态
- [ ] 为每个图表记录容器高度、轴标签、刻度、图例、注释、Tooltip 与裁切问题
- [ ] 为每个表格记录列宽、换行、行高、数字对齐、标题与截断问题
- [ ] 审计全局舞台缩放策略，停止通过整体缩小解决小视口适配
- [ ] 建立正文、标签、图例、坐标轴、数字、按钮与说明文字的最小可读字号
- [ ] 修复 Challenge 主图、事件卡、时间窗与目标剖面的空间分配
- [ ] 修复 Design 配置表、剖面/3D 视图、预测图和模型说明的完整展示
- [ ] 修复 Run 播放区、空间重建、传感器读数、响应曲线与摘要指标的完整展示
- [ ] 修复 Analyse 三组证据图、参数表、Guidance、Trade-off 与策略比较的完整展示
- [ ] 校验所有 Tooltip、展开依据、抽屉、导出面板与交互状态不会覆盖关键文字
- [ ] 在 1440×810 与 1920×1080 逐页复核所有图表、表格和文字无裁切且清晰可读
- [ ] 运行 TypeScript、科学测试、生产构建与浏览器交互回归
- [ ] 保存检查点、自动发布并在正式域名逐页验证

## Entering page hero visual upgrade

- [x] 审计进入页右侧现有视觉、容器比例、叠层和启动序列动效
- [x] 生成符合深色科研仪器品牌语言的高质量 CAVE 主视觉资产
- [x] 替换低质右侧示意图，并以景深、粒子和扫描光设计克制的动态效果
- [x] 保证主标题、入口按钮和启动读数与新视觉保持清晰对比
- [x] 为 prefers-reduced-motion 提供稳定静态回退
- [x] 在 1440×810 与 1920×1080 验证构图、动画、裁切和加载表现
- [x] 运行 TypeScript、科学测试与生产构建
- [x] 保存检查点并自动发布新版进入页

## Research-grounded CAVE laboratory hero rebuild

- [ ] 检索 CAVE 实验室的官方页面、公开论文、项目介绍与可用照片
- [ ] 交叉核验空间类型、建筑构造、风路、传感器、数据采集与实验场景
- [ ] 整理可用于视觉生成的真实特征、明确事实与不可确认部分
- [ ] 依据核验后的特征生成更接近真实 CAVE 实验环境的主视觉
- [ ] 替换进入页图像，并校准空气流线、测点、尺寸线与动态标注层
- [ ] 在 1440×810 与 1920×1080 验证真实性、构图、文字对比与动态表现
- [ ] 运行 TypeScript、科学测试与生产构建
- [ ] 保存检查点并自动发布真实资料驱动版本
