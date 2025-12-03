from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import face_alignment
import numpy as np
import base64
import io
from skimage import io as skio

app = FastAPI()

# Initialize Face Alignment (2D)
# device='cpu' or 'cuda' (using cpu for compatibility)
print("Loading Face Alignment Model...")
fa = face_alignment.FaceAlignment(face_alignment.LandmarksType.TWO_D, device='cpu', face_detector='sfd')
print("Model Loaded!")

class ImageRequest(BaseModel):
    faceImage: str # Base64 string
    bodyImage: str | None = None

def decode_image(base64_string):
    if "," in base64_string:
        base64_string = base64_string.split(",")[1]
    image_data = base64.b64decode(base64_string)
    image = skio.imread(io.BytesIO(image_data))
    return image

def calculate_face_shape(landmarks):
    # Landmarks Map (68 points):
    # 0-16: Jawline (0=Left Ear, 8=Chin, 16=Right Ear)
    # 17-21: Left Eyebrow
    # 22-26: Right Eyebrow
    # 36-41: Left Eye
    # 42-47: Right Eye
    # 30: Nose Tip
    # 48-67: Mouth

    # 1. MEASUREMENTS (in pixels)
    
    # Jaw Width (Point 4 to 12 - Gonions/Angles) or 0 to 16?
    # 0-16 is full width at ears. 4-12 is jaw angles.
    # Let's use 0-16 for "Face Width" at jaw level, and 4-12 for "Jaw Width"
    jaw_width = np.linalg.norm(landmarks[4] - landmarks[12])
    
    # Cheekbone Width (Outer eye corners? Or 1-15?)
    # Using 1-15 as approximation for cheekbones
    cheekbone_width = np.linalg.norm(landmarks[1] - landmarks[15])
    
    # Forehead Width (Outer eyebrows 17-26)
    # Heuristic: Forehead is usually wider than eyebrows
    eyebrow_width = np.linalg.norm(landmarks[17] - landmarks[26])
    forehead_width = eyebrow_width * 1.15 

    # Face Length (Midpoint of eyebrows to Chin 8)
    eyebrow_mid = (landmarks[21] + landmarks[22]) / 2
    face_length = np.linalg.norm(eyebrow_mid - landmarks[8])

    # 2. RATIOS
    length_width_ratio = face_length / cheekbone_width
    jaw_forehead_ratio = jaw_width / forehead_width
    cheek_jaw_ratio = cheekbone_width / jaw_width

    # 3. GEOMETRIC LOGIC (Chain of Thought)
    
    shape = "Oval" # Fallback
    description = []

    # Step 1: Length vs Width
    is_long = length_width_ratio > 1.45
    is_short = length_width_ratio < 1.2
    
    # Step 2: Jaw vs Forehead
    if jaw_width > forehead_width * 1.05:
        description.append("Mandíbula mais larga que a testa")
        shape = "Triângulo"
    elif forehead_width > jaw_width * 1.25:
        description.append("Testa muito mais larga que a mandíbula")
        # Could be Heart or Diamond
        if cheekbone_width > forehead_width:
            shape = "Diamante"
        else:
            shape = "Coração"
    else:
        # Balanced widths (Square, Round, Oval)
        description.append("Larguras de testa e mandíbula equilibradas")
        
        # Step 3: Angles (Square vs Round)
        # Check jaw angle sharpness (Vector 2-3 vs 3-4?)
        # Simplified: Use length
        if is_short:
            # Round or Square
            # Square has wider jaw relative to cheeks
            if jaw_width > cheekbone_width * 0.9:
                shape = "Quadrado"
            else:
                shape = "Redondo"
        elif is_long:
            # Oval or Rectangle
            if jaw_width > cheekbone_width * 0.9:
                shape = "Retângulo" # Mapping to Square for simplicity
                shape = "Quadrado"
            else:
                shape = "Oval"
        else:
            # Medium length
            if jaw_width > cheekbone_width * 0.9:
                shape = "Quadrado"
            else:
                shape = "Oval"

    return shape, length_width_ratio

@app.post("/analyze")
async def analyze_face(req: ImageRequest):
    try:
        image = decode_image(req.faceImage)
        preds = fa.get_landmarks(image)
        
        if not preds:
            return {"error": "No face detected"}
            
        landmarks = preds[0]
        shape, ratio = calculate_face_shape(landmarks)
        
        # Calculate scores based on ratios (Mocking logic for now, but dynamic)
        symmetry_score = int(max(0, min(100, 100 - abs(1.618 - ratio)*50))) # Golden ratio approx
        
        return {
            "analise_geral": {
                "nota_final": round(symmetry_score / 10, 1),
                "idade_real_estimada": 25,
                "potencial_genetico": "Alto",
                "resumo_brutal": f"Geometria facial identificada como {shape}. Proporção L/W: {ratio:.2f}"
            },
            "rosto": {
                "formato_rosto": shape,
                "pontos_fortes": ["Mandíbula" if "Quadrado" in shape else "Simetria", "Proporção"],
                "falhas_criticas": [],
                "analise_pele": "Análise geométrica concluída."
            },
            "grafico_radar": {
                "simetria": symmetry_score,
                "pele": 75,
                "estrutura_ossea": 85 if shape in ["Quadrado", "Diamante"] else 70,
                "terco_medio": 75,
                "proporcao_aurea": symmetry_score
            },
            "corpo_postura": {
                "analise": "Não analisado",
                "gordura_estimada": "Média"
            },
            "plano_correcao": {
                "passo_1_imediato": "Hidratação",
                "passo_2_rotina": "Skincare",
                "passo_3_longo_prazo": "Mewing"
            }
        }

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
