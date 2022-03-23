import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { TreeItem, TreeView } from "@mui/lab";
import { useMemo, useState, useCallback } from "react";
import { Box } from "@mui/material";

// pulled from react-merge-refs

const RenderStaticNode = ({ item }) => {
  return (
    <TreeItem key={item.id} nodeId={item.id} label={`Item ${item.id}`}>
      {item.children?.length > 0
        ? item.children.map((childItem, index) => (
            <RenderStaticNode key={childItem.id} item={childItem} />
          ))
        : null}
    </TreeItem>
  );
};

function mergeRefs(refs) {
  return (value) => {
    value?.addEventListener("focusin", (e) => {
      // Disable Treeview focus system which make draggable on TreeIten unusable
      // see https://github.com/mui-org/material-ui/issues/29518
      e.stopImmediatePropagation();
    });
    // console.log(value)
    refs.forEach((ref) => {
      if (typeof ref === "function") {
        ref(value);
      } else if (ref != null) {
        ref.current = value;
      }
    });
  };
}

const RenderDraggableNode = ({ item, onDrop }) => {
  const [{ isDragging }, drag, dragPreview] = useDrag(() => ({
    type: "item",
    item,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
      handlerId: monitor.getHandlerId(),
    }),
  }));
  const [{ canDrop, isOverCurrent }, drop] = useDrop(() => ({
    accept: "item",
    drop(droppedItem, monitor) {
      const didDrop = monitor.didDrop();
      if (didDrop) {
        return;
      }
      onDrop(droppedItem, item);
    },
    collect: (monitor) => ({
      isOverCurrent: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  }));
  //   const ref = useCallback((elt) => {
  //     //   console.log(elt)
  //     elt?.addEventListener('focusin', (e) => {
  //       // Disable Treeview focus system which make draggable on TreeIten unusable
  //       // see https://github.com/mui-org/material-ui/issues/29518
  //       e.stopImmediatePropagation();
  //     })
  //     drag(elt);
  //   }, [drag])

  const isActive = canDrop && isOverCurrent;
  return (
    <TreeItem
      ref={mergeRefs([drag, drop, dragPreview])}
      key={item.id}
      nodeId={item.id}
      label={`Item ${item.id}`}
      sx={{
        backgroundColor: isActive ? "rgba(22, 52, 71, 0.08)" : "unset",
      }}
    >
      {isDragging
        ? null
        : item.children?.length > 0
        ? item.children.map((childItem, index) => (
            <RenderDraggableNode
              onDrop={onDrop}
              key={childItem.id}
              item={childItem}
            />
          ))
        : null}
    </TreeItem>
  );
};

function mapTree(items, key) {
  const tempItems = items.map((item, index) => {
    return {
      ...item,
      children: [],
    };
  });
  const map = {};
  let node;
  const roots = [];
  let i;
  for (i = 0; i < tempItems.length; i += 1) {
    map[tempItems[i].id] = i; // initialize the map
  }
  for (i = 0; i < tempItems.length; i += 1) {
    node = tempItems[i];
    if (node[key] && tempItems[map[node[key]]]) {
      // if you have dangling branches check that map[node.parentId] exists
      tempItems[map[node[key]]].children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

const TreeRoot = ({ children, setNodes, ...rest }) => {
  const [{ canDrop, isOverCurrent }, drop] = useDrop(() => ({
    accept: "item",
    drop(item, monitor) {
      const didDrop = monitor.didDrop();
      if (didDrop || !item.parentId) {
        return;
      }
      setNodes((stateNodes) =>
        stateNodes.map((stateNode) => {
          if (stateNode.id === item.id) {
            return {
              ...stateNode,
              parentId: null,
            };
          } else {
            return stateNode;
          }
        })
      );
    },
    collect: (monitor) => ({
      isOverCurrent: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  }));
  const isActive = canDrop && isOverCurrent;
  return (
    <div
      ref={drop}
      style={{
        height: "100%",
        backgroundColor: isActive ? "rgba(22, 52, 71, 0.08)" : "unset",
      }}
    >
      <TreeView {...rest}>{children}</TreeView>
    </div>
  );
};
const ItemsTree = () => {
  const [nodes, setNodes] = useState([
    { id: "0", disabled: false, parentId: null },
    { id: "1", disabled: false, parentId: "0" },
    { id: "2", disabled: false, parentId: "0" },
    { id: "3", disabled: false, parentId: "0" },
    { id: "4", disabled: false, parentId: "2" },
    { id: "5", disabled: false, parentId: "2" },
    { id: "6", disabled: false, parentId: "2" },
    { id: "7", disabled: false, parentId: "6" },
    { id: "8", disabled: false, parentId: "7" },
    { id: "9", disabled: false, parentId: null },
    { id: "10", disabled: true, parentId: null },
  ]);
  const mappedItems = useMemo(() => mapTree(nodes, "parentId"), [nodes]);
  const onDrop = (droppedItem, containerItem) => {
    if(containerItem.id===droppedItem.id){
        return 
    }
    setNodes((stateNodes) =>
      stateNodes.map((stateNode) => {
          
        if (stateNode.id === droppedItem.id) {
          return {
            ...stateNode,
            parentId: containerItem.id,
          };
        } else {
          return stateNode;
        }
      })
    );
  };
  console.log(nodes);
  return (
    <Box sx={{ height: "100vh", width: "100vw" }}>
      <DndProvider backend={HTML5Backend}>
        <TreeRoot
          setNodes={setNodes}
          defaultExpanded={nodes
            .filter((item) => item.disabled)
            .map((item) => item.id)}
          defaultSelected={nodes
            .filter((item) => item.disabled)
            .map((item) => item.id)}
          aria-label="items navigator"
          defaultCollapseIcon={<ExpandMoreIcon />}
          defaultExpandIcon={<ChevronRightIcon />}
          sx={{ height: "100%", flexGrow: 1, width: "100%", overflowY: "auto" }}
        >
          {mappedItems.map((item, index) => (
            <RenderDraggableNode key={item.id} item={item} onDrop={onDrop} />
          ))}
        </TreeRoot>
      </DndProvider>
    </Box>
  );
};

export default ItemsTree;
