from google.cloud import storage
import os
import uuid
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Obtener configuración del bucket desde variables de entorno
bucket_name = os.getenv("GCS_BUCKET_NAME")
if not bucket_name:
    raise ValueError("GCS_BUCKET_NAME environment variable is not set")

# Configurar la ruta correcta a las credenciales
credentials_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 
                              "secrets", 
                              "archiatect-eda217aa21c8.json")
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = credentials_path

try:
    # Crear el cliente usando las credenciales configuradas
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
except Exception as e:
    raise Exception(f"Failed to initialize GCS client: {str(e)}")

def upload_to_gcs(local_file_path: str, folder: str = "generated") -> str:
    """
    Sube un archivo a Google Cloud Storage y devuelve la URL pública.
    
    Args:
        local_file_path (str): Ruta del archivo local a subir
        folder (str): Carpeta dentro del bucket donde se guardará el archivo
        
    Returns:
        str: URL pública del archivo subido
        
    Raises:
        FileNotFoundError: Si el archivo local no existe
        Exception: Si hay un error al subir el archivo
    """
    if not os.path.isfile(local_file_path):
        raise FileNotFoundError(f"File not found: {local_file_path}")

    try:
        # Nombre único en GCS
        filename = f"{folder}/{uuid.uuid4().hex}_{os.path.basename(local_file_path)}"
        blob = bucket.blob(filename)
        
        # Subir el archivo
        blob.upload_from_filename(local_file_path)
        
        # Con uniform bucket-level access, la URL pública se construye directamente
        return f"https://storage.googleapis.com/{bucket_name}/{filename}"
    except Exception as e:
        raise Exception(f"Failed to upload file to GCS: {str(e)}")