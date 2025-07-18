struct FragInput {
  @builtin(position) position: vec4f,
}

@fragment fn fs(input: FragInput) -> @location(0) vec4f {
  // Calculate the center of the current point
  // This assumes we're rendering quads/triangles for each point
  let pointCoord = fract(input.position.xy / 16.0); // Adjust divisor based on point size
  
  // Calculate distance from center (0.5, 0.5)
  let center = vec2f(0.5, 0.5);
  let distance = length(pointCoord - center);
  
  // Create circular shape with smooth edges
  let radius = 0.4; // Adjust for circle size
  let smoothness = 0.1; // Adjust for edge softness
  
  // Create smooth alpha falloff
  let alpha = 1.0 - smoothstep(radius - smoothness, radius + smoothness, distance);
  
  // Discard transparent pixels
  if (alpha < 0.01) {
    discard;
  }
  
  // Return white color with calculated alpha
  return vec4f(1.0, 1.0, 1.0, alpha);
} 