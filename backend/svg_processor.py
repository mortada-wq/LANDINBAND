"""
SVG Processing Module - Traditional tools for layer separation
No AI calls after master SVG generation
"""

import xml.etree.ElementTree as ET
from pathlib import Path
import re
from typing import List, Tuple, Dict, Optional


def parse_svg_buildings(svg_content: str) -> Tuple[List[Dict], str]:
    """
    Extract individual buildings from master SVG with metadata
    
    Args:
        svg_content: Complete SVG XML string
        
    Returns:
        Tuple of:
        - List of building dicts with height, elements, bounding boxes
        - ViewBox string
    """
    try:
        # Remove XML declaration if present for parsing
        svg_content_clean = svg_content
        if svg_content.startswith('<?xml'):
            svg_content_clean = '\n'.join(svg_content.split('\n')[1:])
        
        root = ET.fromstring(svg_content_clean)
        
        # Handle namespace
        ns = {'svg': 'http://www.w3.org/2000/svg'}
        if root.tag.startswith('{'):
            ns_match = re.match(r'\{(.*?)\}', root.tag)
            if ns_match:
                ns['svg'] = ns_match.group(1)
        
        # Extract viewBox
        viewbox = root.get('viewBox', '0 0 800 600')
        viewbox_parts = viewbox.split()
        canvas_height = float(viewbox_parts[3]) if len(viewbox_parts) == 4 else 600
        
        buildings = []
        
        # Try to find structured <g> elements with id="building-N"
        groups = root.findall('.//svg:g[@id]', ns) if ns else root.findall('.//g[@id]')
        
        structured_buildings = []
        for group in groups:
            group_id = group.get('id', '')
            if 'building' in group_id.lower():
                # Extract height from data-height attribute or calculate from bbox
                data_height = group.get('data-height')
                
                # Get all elements in the group
                elements = list(group)
                if not elements:
                    continue
                
                # Calculate bounding box for the group
                bbox = get_group_bbox(group)
                if bbox is None:
                    continue
                
                x_min, y_min, x_max, y_max = bbox
                
                # Calculate normalized height (0-10 scale)
                # Lower Y coordinate = taller building
                # Height = 10 * (1 - (y_coord / canvas_height))
                if data_height:
                    try:
                        building_top_y = float(data_height)
                    except (ValueError, TypeError):
                        building_top_y = y_min
                else:
                    building_top_y = y_min
                
                normalized_height = 10 * (1 - (building_top_y / canvas_height))
                normalized_height = max(0, min(10, normalized_height))  # Clamp to 0-10
                
                structured_buildings.append({
                    'id': group_id,
                    'height': normalized_height,
                    'element': group,
                    'bbox': bbox,
                    'center_x': (x_min + x_max) / 2,
                    'top_y': building_top_y
                })
        
        if structured_buildings:
            # Use structured buildings
            return structured_buildings, viewbox
        
        # Fallback: Extract all shapes and cluster them
        all_shapes = []
        
        # Find all shape elements (rect, line, path, polygon, polyline, circle, ellipse)
        for tag in ['rect', 'line', 'path', 'polygon', 'polyline', 'circle', 'ellipse']:
            shapes = root.findall(f'.//svg:{tag}', ns) if ns else root.findall(f'.//{tag}')
            for shape in shapes:
                bbox = calculate_bbox(shape)
                if bbox:
                    x_min, y_min, x_max, y_max = bbox
                    all_shapes.append({
                        'element': shape,
                        'bbox': bbox,
                        'center_x': (x_min + x_max) / 2,
                        'top_y': y_min
                    })
        
        if not all_shapes:
            # No shapes found, return empty
            return [], viewbox
        
        # Cluster shapes into buildings
        buildings = cluster_shapes_into_buildings(all_shapes)
        
        # Calculate normalized heights for each building
        for building in buildings:
            building_top_y = building['top_y']
            normalized_height = 10 * (1 - (building_top_y / canvas_height))
            normalized_height = max(0, min(10, normalized_height))
            building['height'] = normalized_height
        
        return buildings, viewbox
        
    except Exception as e:
        print(f"Error parsing SVG buildings: {e}")
        return [], "0 0 800 600"


def calculate_bbox(elem: ET.Element) -> Optional[Tuple[float, float, float, float]]:
    """
    Calculate bounding box (x_min, y_min, x_max, y_max) for any SVG element
    Supports: rect, line, path, polygon, polyline, circle, ellipse
    
    Args:
        elem: SVG element
        
    Returns:
        Tuple of (x_min, y_min, x_max, y_max) or None if cannot calculate
    """
    tag = elem.tag.split('}')[-1] if '}' in elem.tag else elem.tag
    
    try:
        if tag == 'rect':
            x = float(elem.get('x', 0))
            y = float(elem.get('y', 0))
            width = float(elem.get('width', 0))
            height = float(elem.get('height', 0))
            return (x, y, x + width, y + height)
        
        elif tag == 'line':
            x1 = float(elem.get('x1', 0))
            y1 = float(elem.get('y1', 0))
            x2 = float(elem.get('x2', 0))
            y2 = float(elem.get('y2', 0))
            return (min(x1, x2), min(y1, y2), max(x1, x2), max(y1, y2))
        
        elif tag == 'circle':
            cx = float(elem.get('cx', 0))
            cy = float(elem.get('cy', 0))
            r = float(elem.get('r', 0))
            return (cx - r, cy - r, cx + r, cy + r)
        
        elif tag == 'ellipse':
            cx = float(elem.get('cx', 0))
            cy = float(elem.get('cy', 0))
            rx = float(elem.get('rx', 0))
            ry = float(elem.get('ry', 0))
            return (cx - rx, cy - ry, cx + rx, cy + ry)
        
        elif tag == 'polygon' or tag == 'polyline':
            points_str = elem.get('points', '')
            if not points_str:
                return None
            coords = extract_coords_from_points(points_str)
            if not coords:
                return None
            xs = [x for x, y in coords]
            ys = [y for x, y in coords]
            return (min(xs), min(ys), max(xs), max(ys))
        
        elif tag == 'path':
            path_data = elem.get('d', '')
            if not path_data:
                return None
            coords = extract_coords_from_path(path_data)
            if not coords:
                return None
            xs = [x for x, y in coords]
            ys = [y for x, y in coords]
            return (min(xs), min(ys), max(xs), max(ys))
        
        return None
    
    except (ValueError, TypeError) as e:
        return None


def extract_coords_from_path(path_data: str) -> List[Tuple[float, float]]:
    """
    Parse SVG path 'd' attribute to extract coordinate pairs
    
    Args:
        path_data: SVG path data string
        
    Returns:
        List of (x, y) coordinate tuples
    """
    coords = []
    
    # Remove commas and extra whitespace
    path_data = path_data.replace(',', ' ')
    path_data = re.sub(r'\s+', ' ', path_data)
    
    # Extract all numbers (including negative and decimals)
    numbers = re.findall(r'-?\d+\.?\d*', path_data)
    
    # Group numbers into coordinate pairs
    i = 0
    while i < len(numbers) - 1:
        try:
            x = float(numbers[i])
            y = float(numbers[i + 1])
            coords.append((x, y))
            i += 2
        except (ValueError, IndexError):
            i += 1
    
    return coords


def extract_coords_from_points(points_str: str) -> List[Tuple[float, float]]:
    """
    Parse SVG polygon/polyline 'points' attribute to extract coordinate pairs
    
    Args:
        points_str: SVG points string
        
    Returns:
        List of (x, y) coordinate tuples
    """
    coords = []
    
    # Remove commas and extra whitespace
    points_str = points_str.replace(',', ' ')
    points_str = re.sub(r'\s+', ' ', points_str).strip()
    
    # Extract all numbers
    numbers = re.findall(r'-?\d+\.?\d*', points_str)
    
    # Group numbers into coordinate pairs
    i = 0
    while i < len(numbers) - 1:
        try:
            x = float(numbers[i])
            y = float(numbers[i + 1])
            coords.append((x, y))
            i += 2
        except (ValueError, IndexError):
            i += 1
    
    return coords


def cluster_shapes_into_buildings(shapes: List[Dict]) -> List[Dict]:
    """
    Group shapes that are horizontally close into building clusters
    Used as fallback when AI doesn't provide structured <g> elements
    
    Args:
        shapes: List of shape dicts with bbox and center_x
        
    Returns:
        List of building dicts
    """
    if not shapes:
        return []
    
    # Sort shapes by center X coordinate
    shapes_sorted = sorted(shapes, key=lambda s: s['center_x'])
    
    buildings = []
    current_cluster = []
    cluster_threshold = 50  # Shapes within 50px are considered same building
    
    for shape in shapes_sorted:
        if not current_cluster:
            current_cluster.append(shape)
        else:
            # Check if shape is close to the cluster
            prev_center = current_cluster[-1]['center_x']
            if abs(shape['center_x'] - prev_center) <= cluster_threshold:
                current_cluster.append(shape)
            else:
                # Save current cluster as a building
                if current_cluster:
                    buildings.append(create_building_from_cluster(current_cluster))
                current_cluster = [shape]
    
    # Don't forget the last cluster
    if current_cluster:
        buildings.append(create_building_from_cluster(current_cluster))
    
    return buildings


def create_building_from_cluster(cluster: List[Dict]) -> Dict:
    """
    Create a building dict from a cluster of shapes
    
    Args:
        cluster: List of shape dicts
        
    Returns:
        Building dict with combined bbox and elements
    """
    # Calculate combined bounding box
    all_bboxes = [s['bbox'] for s in cluster]
    x_min = min(bbox[0] for bbox in all_bboxes)
    y_min = min(bbox[1] for bbox in all_bboxes)
    x_max = max(bbox[2] for bbox in all_bboxes)
    y_max = max(bbox[3] for bbox in all_bboxes)
    
    # Create a group element to hold all shapes
    group = ET.Element('g')
    group.set('id', f'building-cluster-{id(cluster)}')
    
    for shape in cluster:
        group.append(shape['element'])
    
    return {
        'id': group.get('id'),
        'height': 0,  # Will be calculated later
        'element': group,
        'bbox': (x_min, y_min, x_max, y_max),
        'center_x': (x_min + x_max) / 2,
        'top_y': y_min
    }


def separate_buildings_into_layers(master_svg: str, city_id: str) -> List[str]:
    """
    Separate buildings into 3 layers based on height:
    - Layer 1: Height 0-3 (foreground/shortest)
    - Layer 2: Height 3-6 (middle ground)
    - Layer 3: Height 6-10 (background/tallest)
    
    Args:
        master_svg: Master SVG content
        city_id: City ID for file naming
        
    Returns:
        List of 3 file paths
    """
    buildings, viewbox = parse_svg_buildings(master_svg)
    
    if not buildings:
        raise ValueError("No buildings found in master SVG")
    
    # Separate buildings by height
    layer_1_buildings = []  # Height 0-3
    layer_2_buildings = []  # Height 3-6
    layer_3_buildings = []  # Height 6-10
    
    for building in buildings:
        height = building['height']
        if height <= 3:
            layer_1_buildings.append(building)
        elif height <= 6:
            layer_2_buildings.append(building)
        else:
            layer_3_buildings.append(building)
    
    # Create output directory
    from pathlib import Path
    output_dir = Path(__file__).parent.parent / "uploads" / "processed"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate layer SVGs
    layer_paths = []
    for layer_num, layer_buildings in enumerate([layer_1_buildings, layer_2_buildings, layer_3_buildings], 1):
        layer_svg = create_layer_svg(layer_buildings, viewbox)
        
        layer_path = output_dir / f"{city_id}_layer_{layer_num}.svg"
        with open(layer_path, 'w', encoding='utf-8') as f:
            f.write(layer_svg)
        
        layer_paths.append(str(layer_path))
    
    return layer_paths


def create_layer_svg(buildings: List[Dict], viewbox: str) -> str:
    """
    Generate complete SVG for a single layer
    
    Args:
        buildings: List of building dicts
        viewbox: ViewBox string
        
    Returns:
        Complete SVG string
    """
    # Create SVG root
    svg = ET.Element('svg')
    svg.set('xmlns', 'http://www.w3.org/2000/svg')
    svg.set('viewBox', viewbox)
    
    # Add each building
    for building in buildings:
        svg.append(building['element'])
    
    # Convert to string
    svg_str = ET.tostring(svg, encoding='unicode')
    
    # Add XML declaration
    return f'<?xml version="1.0" encoding="UTF-8"?>\n{svg_str}'


def apply_horizontal_spacing(svg_content: str, expansion_percent: int) -> str:
    """
    Apply horizontal spacing using SVG transforms - INSTANT
    
    Algorithm:
    1. Find canvas center X
    2. For each building group:
       - Calculate building center X
       - Calculate distance from canvas center
       - Multiply distance by expansion factor
       - Apply translate(x, 0) transform
    3. Update viewBox width
    
    No AI call needed - pure geometry!
    
    Args:
        svg_content: Original SVG content
        expansion_percent: Expansion percentage (0-200)
        
    Returns:
        Transformed SVG content
    """
    try:
        # Parse SVG
        svg_content_clean = svg_content
        if svg_content.startswith('<?xml'):
            xml_declaration = svg_content.split('\n')[0] + '\n'
            svg_content_clean = '\n'.join(svg_content.split('\n')[1:])
        else:
            xml_declaration = '<?xml version="1.0" encoding="UTF-8"?>\n'
        
        root = ET.fromstring(svg_content_clean)
        
        # Extract viewBox
        viewbox = root.get('viewBox', '0 0 800 600')
        viewbox_parts = [float(x) for x in viewbox.split()]
        canvas_x, canvas_y, canvas_width, canvas_height = viewbox_parts
        
        # Calculate center X
        center_x = canvas_x + canvas_width / 2
        
        # Calculate expansion factor
        expansion_factor = expansion_percent / 100.0
        
        if expansion_factor == 0:
            # No change needed
            return svg_content
        
        # Find all building groups or top-level elements
        groups = root.findall('.//g') + root.findall('.//rect') + root.findall('.//path') + root.findall('.//line') + root.findall('.//polygon') + root.findall('.//polyline') + root.findall('.//circle') + root.findall('.//ellipse')
        
        # Apply transform to each element
        for elem in groups:
            # Get bounding box
            bbox = get_group_bbox(elem) if elem.tag.endswith('g') else calculate_bbox(elem)
            if not bbox:
                continue
            
            x_min, y_min, x_max, y_max = bbox
            building_center_x = (x_min + x_max) / 2
            
            # Calculate distance from center
            distance_from_center = building_center_x - center_x
            
            # Calculate new distance
            new_distance = distance_from_center * (1 + expansion_factor)
            
            # Calculate shift
            shift_x = new_distance - distance_from_center
            
            if abs(shift_x) > 0.1:  # Only apply if significant
                # Get existing transform
                existing_transform = elem.get('transform', '')
                
                # Add translate
                new_transform = f'translate({shift_x:.2f}, 0)'
                if existing_transform:
                    new_transform = f'{existing_transform} {new_transform}'
                
                elem.set('transform', new_transform)
        
        # Update viewBox width
        new_width = canvas_width * (1 + expansion_factor)
        new_viewbox = f'{canvas_x} {canvas_y} {new_width:.2f} {canvas_height}'
        root.set('viewBox', new_viewbox)
        
        # Convert back to string
        svg_str = ET.tostring(root, encoding='unicode')
        
        return xml_declaration + svg_str
    
    except Exception as e:
        print(f"Error applying spacing: {e}")
        return svg_content


def get_group_bbox(group: ET.Element) -> Optional[Tuple[float, float, float, float]]:
    """
    Get bounding box of all elements in a group
    
    Args:
        group: SVG group element
        
    Returns:
        Combined bounding box or None
    """
    bboxes = []
    
    # Get all child elements
    for child in group.iter():
        if child == group:
            continue
        bbox = calculate_bbox(child)
        if bbox:
            bboxes.append(bbox)
    
    if not bboxes:
        return None
    
    # Combine all bounding boxes
    x_min = min(bbox[0] for bbox in bboxes)
    y_min = min(bbox[1] for bbox in bboxes)
    x_max = max(bbox[2] for bbox in bboxes)
    y_max = max(bbox[3] for bbox in bboxes)
    
    return (x_min, y_min, x_max, y_max)
