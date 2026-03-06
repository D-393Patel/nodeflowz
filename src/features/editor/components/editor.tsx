"use client"

import { useState, useCallback } from 'react';
import { 
    ReactFlow, 
    applyNodeChanges, 
    applyEdgeChanges, 
    addEdge,
    type Node,
    type Edge,
    type NodeChange,
    type EdgeChange,
    type Connection,
    ReactFlowProvider,
    Background,
    Controls,
    MiniMap,
    Panel,
 } from '@xyflow/react';
import { ErrorView, LoadingView } from "@/components/entity-components";
import { useSuspenseWorkflow } from "@/features/workflows/hooks/use-workflows";

import '@xyflow/react/dist/style.css';
import { nodeComponents } from '@/config/node-components';
import { AddNodeButton } from './add-node-button';
import { useSetAtom } from 'jotai';
import { editorAtom } from '../store/atoms';

// const initialNodes = [
//   { id: 'n1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
//   { id: 'n2', position: { x: 0, y: 100 }, data: { label: 'Node 2' } },
// ];

//const initialEdges = [{ id: 'n1-n2', source: 'n1', target: 'n2' }];

export const EditorLoading=()=>{
    return <LoadingView message="Loading editor..."/>
}
export const EditorError=()=>{
    return <ErrorView message="Error loading editor"/>
}
export const Editor=({workflowId}:{workflowId:string})=>{
    const {data:workflow}=useSuspenseWorkflow(workflowId);
    const setEditor=useSetAtom(editorAtom);
    const [nodes, setNodes] = useState<Node[]>(workflow.nodes);
  const [edges, setEdges] = useState<Edge[]>(workflow.edges);

   const onNodesChange = useCallback(
    (changes:NodeChange[]) => setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    [],
  );
  const onEdgesChange = useCallback(
    (changes:EdgeChange[]) => setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    [],
  );
  const onConnect = useCallback(
    (params:Connection) => setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
    [],
  );
    return (
        <div className='w-full h-screen'>
  <ReactFlowProvider>
    <ReactFlow 
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={nodeComponents}
      onInit={setEditor}
      fitView
      snapGrid={[10,10]}
      snapToGrid
      panOnScroll
      panOnDrag={false}
      selectionOnDrag
    >
      <Background/>
      <Controls position="top-left" />
      <MiniMap/>
      <Panel position='top-right'>
        <AddNodeButton />
      </Panel>
    </ReactFlow>
  </ReactFlowProvider>
</div>
    )

}