/** 
 * javascript comment 
 * @Author: 王林25 
 * @Date: 2021-06-28 14:05:31 
 * @Desc: 创建vNode对象 
 */
export const h = (tag, data = {}, children) => {
  let text = ''
  let el
  let key
  // 文本节点
  if (typeof children === 'string' || typeof children === 'number') {
    text = children
    children = undefined
  } else if (!Array.isArray(children)) {
    children = undefined
  }
  if (data && data.key) {
    key = data.key
  }
  return {
    tag, // 元素标签
    children, // 子元素
    text, // 文本节点的文本
    el, // 真实dom
    key,
    data
  }
}

/** 
 * javascript comment 
 * @Author: 王林25 
 * @Date: 2021-06-28 16:24:56 
 * @Desc: vnode->dom 
 */
const createEl = (vnode) => {
  let el = document.createElement(vnode.tag)
  vnode.el = el
  if (vnode.children && vnode.children.length > 0) {
    vnode.children.forEach((item) => {
      el.appendChild(createEl(item))
    })
  }
  if (vnode.text) {
    el.appendChild(document.createTextNode(vnode.text))
  }
  return el
}

/** 
 * javascript comment 
 * @Author: 王林25 
 * @Date: 2021-06-29 13:42:55 
 * @Desc: 判断是否是同一个节点 
 */
const isSameNode = (a, b) => {
  return a.key === b.key && a.tag === b.tag
}

/** 
 * javascript comment 
 * @Author: 王林25 
 * @Date: 2021-06-29 15:12:24 
 * @Desc: 在节点列表里寻找同个节点，返回索引 
 */
const findSameNode = (list, node) => {
  return list.findIndex((item) => {
    return item && isSameNode(item, node)
  })
}

/** 
 * javascript comment 
 * @Author: 王林25 
 * @Date: 2021-06-29 09:28:42 
 * @Desc: diff算法 
 */
const diff = (el, oldChildren, newChildren) => {
  // 指针
  let oldStartIdx = 0
  let oldEndIdx = oldChildren.length - 1
  let newStartIdx = 0
  let newEndIdx = newChildren.length - 1
  // 节点
  let oldStartVNode = oldChildren[oldStartIdx]
  let oldEndVNode = oldChildren[oldEndIdx]
  let newStartVNode = newChildren[newStartIdx]
  let newEndVNode = newChildren[newEndIdx]
  while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    if (oldStartVNode === null) {
      oldStartVNode = oldChildren[++oldStartIdx]
    } else if (oldEndVNode === null) {
      oldEndVNode = oldChildren[--oldEndIdx]
    } else if (newStartVNode === null) {
      newStartVNode = oldChildren[++newStartIdx]
    } else if (newEndVNode === null) {
      newEndVNode = oldChildren[--newEndIdx]
    } else if (isSameNode(oldStartVNode, newStartVNode)) { // 头-头
      patchVNode(oldStartVNode, newStartVNode)
      // 更新指针
      oldStartVNode = oldChildren[++oldStartIdx]
      newStartVNode = newChildren[++newStartIdx]
    } else if (isSameNode(oldStartVNode, newEndVNode)) { // 头-尾
      patchVNode(oldStartVNode, newEndVNode)
      // 把oldStartVNode节点移动到最后
      el.insertBefore(oldStartVNode.el, oldEndVNode.el.nextSibling)
      // 更新指针
      oldStartVNode = oldChildren[++oldStartIdx]
      newEndVNode = newChildren[--newEndIdx]
    } else if (isSameNode(oldEndVNode, newStartVNode)) { // 尾-头
      patchVNode(oldEndVNode, newStartVNode)
      // 把oldEndVNode节点移动到oldStartVNode前
      el.insertBefore(oldEndVNode.el, oldStartVNode.el)
      // 更新指针
      oldEndVNode = oldChildren[--oldEndIdx]
      newStartVNode = newChildren[++newStartIdx]
    } else if (isSameNode(oldEndVNode, newEndVNode)) { // 尾-尾
      patchVNode(oldEndVNode, newEndVNode)
      // 更新指针
      oldEndVNode = oldChildren[--oldEndIdx]
      newEndVNode = newChildren[--newEndIdx]
    } else {
      let findIndex = findSameNode(oldChildren, newStartVNode)
      // newStartVNode在旧列表里不存在，那么是新节点，创建插入
      if (findIndex === -1) {
        el.insertBefore(createEl(newStartVNode), oldStartVNode.el)
      } else { // 在旧列表里存在，那么进行patch，并且移动到oldStartVNode前
        let oldVNode = oldChildren[findIndex]
        patchVNode(oldVNode, newStartVNode)
        el.insertBefore(oldVNode.el, oldStartVNode.el)
        oldChildren[findIndex] = null
      }
      newStartVNode = newChildren[++newStartIdx]
    }
  }
  // 旧列表里存在新列表里没有的节点，需要删除
  if (oldStartIdx <= oldEndIdx) {
    for (let i = oldStartIdx; i <= oldEndIdx; i++) {
      removeEvent(oldChildren[i])
      oldChildren[i] && el.removeChild(oldChildren[i].el)
    }
  } else if (newStartIdx <= newEndIdx) {
    let before = newChildren[newEndIdx + 1] ? newChildren[newEndIdx + 1].el : null
    for (let i = newStartIdx; i <= newEndIdx; i++) {
      el.insertBefore(createEl(newChildren[i]), before)
    }
  }
}

/** 
 * javascript comment 
 * @Author: 王林25 
 * @Date: 2021-06-29 16:58:44 
 * @Desc: 更新类名 
 */
const updateClass = (el, newVNode) => {
  el.className = ''
  if (newVNode.data && newVNode.data.class) {
    let className = ''
    Object.keys(newVNode.data.class).forEach((cla) => {
      if (newVNode.data.class[cla]) {
        className += cla + ' '
      }
    })
    el.className = className
  }
}

/** 
 * javascript comment 
 * @Author: 王林25 
 * @Date: 2021-06-29 17:10:21 
 * @Desc: 更新样式 
 */
const updateStyle = (el, oldVNode, newVNode) => {
  let oldStyle = oldVNode && oldVNode.data.style || {}
  let newStyle = newVNode.data.style || {}
  // 移除旧节点里存在新节点里不存在的样式
  Object.keys(oldStyle).forEach((item) => {
    if (newStyle[item] === undefined || newStyle[item] === '') {
      el.style[item] = ''
    }
  })
  // 添加旧节点不存在的新样式
  Object.keys(newStyle).forEach((item) => {
    if (oldStyle[item] !== newStyle[item]) {
      el.style[item] = newStyle[item]
    }
  })
}

/** 
 * javascript comment 
 * @Author: 王林25 
 * @Date: 2021-06-29 17:23:51 
 * @Desc: 更新属性 
 */
const updateAttr = (el, oldVNode, newVNode) => {
  let oldAttr = oldVNode && oldVNode.data.attr ? oldVNode.data.attr : {}
  let newAttr = newVNode.data.attr || {}
  // 移除旧节点里存在新节点里不存在的属性
  Object.keys(oldAttr).forEach((item) => {
    if (newAttr[item] === undefined || newAttr[item] === '') {
      el.removeAttribute(item)
    }
  })
  // 添加旧节点不存在的新属性
  Object.keys(newAttr).forEach((item) => {
    if (oldAttr[item] !== newAttr[item]) {
      el.setAttribute(item, newAttr[item])
    }
  })
}

/** 
 * javascript comment 
 * @Author: 王林25 
 * @Date: 2021-06-29 17:44:01 
 * @Desc: 移除所有事件 
 */
const removeEvent = (oldVNode) => {
  if (oldVNode && oldVNode.data && oldVNode.data.event) {
    Object.keys(oldVNode.data.event).forEach((item) => {
      oldVNode.el.removeEventListener(item, oldVNode.data.event[item])
    })
  }
}

/** 
 * javascript comment 
 * @Author: 王林25 
 * @Date: 2021-06-29 17:41:37 
 * @Desc: 更新事件 
 */
const updateEvent = (el, oldVNode, newVNode) => {
  let oldEvent = oldVNode && oldVNode.data.event ? oldVNode.data.event : {}
  let newEvent = newVNode.data.event || {}
  // 移除旧节点里存在新节点里不存在的事件
  Object.keys(oldEvent).forEach((item) => {
    if (newEvent[item] === undefined || oldEvent[item] !== newEvent[item]) {
      el.removeEventListener(item, oldEvent[item])
    }
  })
  // 添加旧节点不存在的新事件
  Object.keys(newEvent).forEach((item) => {
    if (oldEvent[item] !== newEvent[item]) {
      el.addEventListener(item, newEvent[item])
    }
  })
}

/** 
 * javascript comment 
 * @Author: 王林25 
 * @Date: 2021-06-28 16:42:15 
 * @Desc: 打补丁 
 */
const patchVNode = (oldVNode, newVNode) => {
  if (oldVNode === newVNode) {
    return
  }
  // 元素标签相同，进行patch
  if (oldVNode.tag === newVNode.tag) {
    // 元素类型相同，那么旧元素肯定是进行复用的
    let el = newVNode.el = oldVNode.el
    updateClass(el, newVNode)
    updateStyle(el, oldVNode, newVNode)
    updateAttr(el, oldVNode, newVNode)
    updateEvent(el, oldVNode, newVNode)
    // 新节点的子节点是文本节点
    if (newVNode.text) {
      // 移除旧节点的子节点
      if (oldVNode.children) {
        oldVNode.children.forEach((item) => {
          removeEvent(item)
          el.removeChild(item.el)
        })
      }
      // 文本内容不相同则更新文本
      if (oldVNode.text !== newVNode.text) {
        el.textContent = newVNode.text
      }
    } else {
      // 新旧节点都存在子节点，那么就要进行diff
      if (oldVNode.children && newVNode.children) {
        diff(el, oldVNode.children, newVNode.children)
      } else if (oldVNode.children) { // 新节点不存在子节点，那么移除旧节点的所有子节点
        oldVNode.children.forEach((item) => {
          removeEvent(item)
          el.removeChild(item.el)
        })
      } else if (newVNode.children) { // 新节点存在子节点
        // 旧节点存在文本节点则移除
        if (oldVNode.text) {
          el.textContent = ''
        }
        // 添加新节点的子节点
        newVNode.children.forEach((item) => {
          el.appendChild(createEl(item))
        })
      } else if (oldVNode.text) { // 新节点啥也没有，旧节点存在文本节点
        el.textContent = ''
      }
    }
  } else { // 不同使用newNode替换oldNode
    let newEl = createEl(newVNode)
    updateClass(newEl, newVNode)
    updateStyle(newEl, null, newVNode)
    updateAttr(newEl, null, newVNode)
    removeEvent(oldNode)
    updateEvent(newEl, null, newVNode)
    let parent = oldVNode.el.parentNode
    parent.insertBefore(newEl, oldVNode.el)
    parent.removeChild(oldVNode.el)
  }
}

/** 
 * javascript comment 
 * @Author: 王林25 
 * @Date: 2021-06-28 15:55:23 
 * @Desc: 入口方法 
 */
export const patch = (oldVNode, newVNode) => {
  // dom元素转换成vnode
  if (!oldVNode.tag) {
    let el = oldVNode
    el.innerHTML = ''
    oldVNode = h(oldVNode.tagName.toLowerCase())
    oldVNode.el = el
  }
  patchVNode(oldVNode, newVNode)
  return newVNode
}
