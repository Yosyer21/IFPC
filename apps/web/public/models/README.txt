Coloca aquí un modelo 3D del balón para que la landing lo use automáticamente:

  public/models/soccer-ball.glb

Si el archivo existe, SoccerBall3D lo carga con GLTFLoader (y lo escala/centra);
si no existe, usa la esfera procedural con textura de balón.
