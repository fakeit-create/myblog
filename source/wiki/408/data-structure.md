---
layout: wiki
title: 数据结构（DS）
wiki: 408
order: 1
menu_id: wiki408
article:
  type: tech
---

# 数据结构（DS）

## 一、知识框架

{% note green %}
数据结构主要研究数据的逻辑结构、存储结构以及在这些结构上定义的运算。408 中通常包括线性表、栈和队列、串、树、图、查找与排序。
{% endnote %}

| 章节 | 重点 |
|---|---|
| 绪论 | 时间复杂度、空间复杂度、逻辑结构与存储结构 |
| 线性表 | 顺序表、单链表、双链表、循环链表 |
| 栈、队列和数组 | 出入栈、循环队列、表达式、特殊矩阵 |
| 串 | 模式匹配、KMP、next 数组 |
| 树与二叉树 | 遍历、线索化、Huffman、BST、AVL |
| 图 | 遍历、最小生成树、最短路径、拓扑排序、关键路径 |
| 查找 | 顺序、折半、散列、B/B+ 树 |
| 排序 | 插入、交换、选择、归并、基数、外部排序 |

## 二、算法复杂度

{% note green %}
设基本操作执行次数为输入规模 `n` 的函数 `T(n)`：

- 时间复杂度关注 `T(n)` 的数量级，忽略低阶项和常数系数。
- 空间复杂度关注算法运行时额外使用的空间。
- 常见数量级：`O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ) < O(n!)`。
- 递归算法的空间复杂度通常需要考虑递归调用栈。
{% endnote %}

## 三、栈与后缀表达式

{% note blue %}
**我的记录**

```c
//后缀表达式，运算符等级相同时，从左到右的顺序
```
{% endnote %}

{% note green %}
**补充：中缀表达式转后缀表达式**

1. 遇到操作数，直接输出。
2. 遇到左括号，将其压入运算符栈。
3. 遇到右括号，持续弹出并输出运算符，直到遇到左括号；左右括号都不输出。
4. 对通常的左结合运算符，当栈顶运算符优先级大于或等于当前运算符时，先弹出栈顶运算符。
5. 扫描结束后，将栈中剩余运算符依次弹出。

后缀表达式求值时，从左向右扫描：操作数入栈；遇到二元运算符时，先弹出的数是右操作数，后弹出的数是左操作数。
{% endnote %}

{% note warning %}
`+、-、*、/` 通常是左结合；若题目引入幂运算等右结合运算符，同优先级时的出栈规则需要单独处理。
{% endnote %}

## 四、快速排序

### 4.1 我的代码

{% note blue %}
**我的记录（原样保留）**

```c
/*
 * @FilePath: \undefinedc:\Users\Administrator\Desktop\Qsort.c
 * @Date: 2026-07-14 14:38:01
 * @创建人: 彭新桥(pengxinqiao@dcwl.com)
 * @描述: 
 * 版权所有：安徽点触网络科技有限公司
 */
//枚举法，快排法。
/// @brief 升序快排
/// @param A 
/// @param L 
/// @param R 
void Qsort(int A[],int L, int R)
{
    if(L>=R)
    return;
    int i = L,j = R;
    int pivot = A[L];
    while(L<R)
    {
        while(i<j && A[j] >= pivot)
        j--;
        while(i<j && A[i] <= pivot)
        i++;
        if(i<j)
        swap(A[i],A[j]);
    }
    swap(A[L],A[i]);
    Qsort(A,L,i-1);
    Qsort(A,i+1,R);
}

void Qsort(int A[],int L, int R)
{
    if(L>=R)
    return;
    int i = L,j = R;
    int pivot = A[L];
    while(L<R)
    {
        while(i<j && A[i]<pivot)
        i++;
        while(i<j && A[j]>pivot)
        j++;
        if(i<j)
        swap(A[i],A[j]);
    }
    swap(A[L],A[i]);
    Qsort(A,L,i-1);
    Qsort(A,i+1,R);
}

void Qsort(int A[], int L, int R)
{
    if (L>=R)
    return;
    int i=L,j=R;
    int pivot=A[L];
    while(L<R)
    {
        while(i<j && A[i]<pivot)
        i++;
        while(i<j && A[j]>pivot)
        j--;
        if(i<j)
        swap(A[i],A[j]);
    }
    swap(A[i],A[L]);
    Qsort(A,L,i-1);
    Qsort(A,i+1,R); 
}

void Qsort(int A[],int L,int R)
{
    if (L>=R)
    return;
    int i = L,j = R;
    int pivot = A[L];
    while(L<R)
    {
        while(i<j && A[i]<pivot)
        i++;
        while(i<j && A[j]>pivot)
        j--;
        if(i<j)
        swap(A[i],A[j]);
    }
    swap(A[i],A[L]);
    Qsort(A,L,i-1);
    Qsort(A,i+1,R);
}
```
{% endnote %}

### 4.2 算法思想

{% note green %}
快速排序使用分治思想：选择一个枢轴 `pivot`，通过一趟划分让枢轴左侧元素不大于它、右侧元素不小于它，再递归排序左右两个子序列。
{% endnote %}

| 项目 | 结论 |
|---|---|
| 最好时间复杂度 | `O(n log n)` |
| 平均时间复杂度 | `O(n log n)` |
| 最坏时间复杂度 | `O(n²)` |
| 最好/平均递归栈 | `O(log n)` |
| 最坏递归栈 | `O(n)` |
| 稳定性 | 不稳定 |
| 基本思想 | 分治 |
| 排序类别 | 内部排序、交换排序 |

### 4.3 参考实现

{% note green %}
下面是单独补充的可编译参考实现，不替换上面的个人代码。

```c
static void Swap(int *a, int *b)
{
    int temp = *a;
    *a = *b;
    *b = temp;
}

void QuickSort(int A[], int L, int R)
{
    if (L >= R)
        return;

    int i = L;
    int j = R;
    int pivot = A[L];

    while (i < j)
    {
        while (i < j && A[j] >= pivot)
            --j;
        while (i < j && A[i] <= pivot)
            ++i;

        if (i < j)
            Swap(&A[i], &A[j]);
    }

    Swap(&A[L], &A[i]);
    QuickSort(A, L, i - 1);
    QuickSort(A, i + 1, R);
}
```
{% endnote %}

{% note warning %}
**原代码旁注（不修改原代码）**

- C 语言不能在同一翻译单元中重复定义四个签名完全相同的 `Qsort`。
- 外层划分循环通常应判断 `i < j`；如果写 `L < R` 且循环中不修改 `L、R`，可能无法退出。
- 第二个版本中的右指针使用了 `j++`，方向需要检查。
- C 标准库没有通用的 `swap(A[i], A[j])`，需要自行定义函数或宏。
- 使用严格的 `<`、`>` 时，如果两端都遇到等于枢轴的元素，需要保证指针仍能移动，否则可能死循环。
{% endnote %}

## 五、查找与排序速查

{% note green %}
### 折半查找

- 仅适用于有序的顺序表。
- 判定树是一棵平衡二叉树，查找长度不超过 `⌊log₂n⌋+1`。
- 链表不支持高效随机访问，因此不适合直接使用折半查找。

### 散列查找

装填因子 `α = 表中记录数 / 散列表长度`。装填因子越大，发生冲突的概率通常越高。常见冲突处理方法包括开放定址法和拉链法。
{% endnote %}

| 排序算法 | 最好 | 平均 | 最坏 | 空间 | 稳定 |
|---|---:|---:|---:|---:|---|
| 直接插入 | `O(n)` | `O(n²)` | `O(n²)` | `O(1)` | 是 |
| 冒泡 | `O(n)` | `O(n²)` | `O(n²)` | `O(1)` | 是 |
| 快速 | `O(n log n)` | `O(n log n)` | `O(n²)` | 平均 `O(log n)` | 否 |
| 简单选择 | `O(n²)` | `O(n²)` | `O(n²)` | `O(1)` | 否 |
| 堆排序 | `O(n log n)` | `O(n log n)` | `O(n log n)` | `O(1)` | 否 |
| 归并 | `O(n log n)` | `O(n log n)` | `O(n log n)` | `O(n)` | 是 |
