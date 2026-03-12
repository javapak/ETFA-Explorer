import { DiagramCanvas } from '../../webgpu-flow/src/components/DiagramCanvas';
import { Node, type NodeProps } from '../../webgpu-flow/src/components/Node';
import { Edge } from '../../webgpu-flow/src/components/Edge';
import { type NodeType } from '../../webgpu-flow/src/components/NodePalette';
import { useEffect, useRef, useState } from 'react';
import erData from '../assets/efta_webgpu_flow.json';
import type { MarkerType } from '../../webgpu-flow/src/renderers/FloatingEdgeRenderer';

console.log = () => {};



const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
};


const getOptimalCanvasSize = () => {
  const isMobile = isMobileDevice();
  if (isMobile) {
    return {
      width: Math.max(300, window.innerWidth - 40),
      height: Math.max(400, window.innerHeight - 200)
    };
  } else {
    return {
      width: window.innerWidth - 250,
      height: window.innerHeight - 150
    };
  }
};

  const handleNodeDropped = (nodeType: NodeType, position: { x: number; y: number }) => {
    const isMobile = isMobileDevice();
    console.log(`Dropped ${nodeType.name} at position:`, position);
    
    // Provide haptic feedback on mobile
    if (isMobile && navigator.vibrate) {
      navigator.vibrate(100);
    }
  };

export default function ERFlow() {
    const [, setSupportedSampleCount] = useState<string[] | undefined>(['2']);
    const [canvasSize, setCanvasSize] = useState(() => getOptimalCanvasSize());
    const [nodes, setNodes] = useState(erData.nodes as NodeProps[]);
    const [edges] = useState(erData.edges);
    const [wikiFetched, setWikiFetched] = useState(false);

    


    
useEffect(() => {
    const lookupNodes = nodes.filter(n => n.data.wikipediaLookup && n.data.wikipediaQuery);

    const fetchAll = async () => {
        const results = await Promise.all(
            lookupNodes.map(async (node) => {
                try {
  
            const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(node.data.wikipediaQuery)}&prop=pageimages&pithumbsize=400&format=json&origin=*`);
            const json = await res.json();
            console.log(json);
            let urlTemp = '';
            const pageResult: Record<string, any> = Object.values<Record<string, any>>(json.query.pages)[0];
            console.log('Portrait image result for entity: ', pageResult);
            if (pageResult?.thumbnail?.source) urlTemp = pageResult.thumbnail.source;

                    return { id: node.id, thumbnail: urlTemp ?? null };
                } catch {
                    return { id: node.id, thumbnail: '' };
                }
            })
        );

        const thumbnailMap = Object.fromEntries(
            results.filter(r => r.thumbnail).map(r => [r.id, r.thumbnail])
        );

        setNodes(prev => prev.map(node => {

            if (!thumbnailMap[node.id]) {
              console.log('node claims no thumb: ', node);
              return node
            }
            if (node.visual?.shape) node.visual.shape = 'none';
            return {
                ...node,
                visual: {
                    ...node.visual,
                    visualContent: {
                        type: 'image',
                        content: thumbnailMap[node.id],
                        size: { width: 100, height: 100 }
                    }
                }
            };
        }));

        setWikiFetched(true);

    };

    fetchAll();

    const handleResize = () => {
      setCanvasSize(getOptimalCanvasSize());
      
    };
    handleResize(); // Initial check

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
}, []);





    const internalResolutionRef = useRef({width: 1920, height: 1080});
    return (
        <>
            <DiagramCanvas 
                    width={canvasSize.width}
                    height={canvasSize.height}
                    setSupportedSampleCount={setSupportedSampleCount}
                    onNodeDropped={handleNodeDropped}
                    internalResolutionRef={internalResolutionRef}
                    showDebugInfo
                    onNodeClick={() => {}}
                    
                  

            />
          
        {wikiFetched && <>{nodes.map((node) => <Node key={node.id} id={node.id} visual={node.visual} type={node.type} position={node.position} data={node.data} /> )} </>}
        {wikiFetched && <>{edges.map((edge) => <Edge key={edge.id} id={edge.id} sourceNodeId={edge.sourceNodeId} data={edge.data} targetNodeId={edge.targetNodeId} userVertices={[]} style={{ targetMarker: edge.style.targetMarker as MarkerType, labelColor: "#ffffff", thickness: 3, color: [0,0,0,255] ,sourceMarker: edge.style.sourceMarker as MarkerType}} />)}</>}
 
            
        </>
    );
        
            
        } 
