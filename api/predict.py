from http.server import BaseHTTPRequestHandler
import json
import numpy as np
import ai_edge_litert.interpreter as tflite
import os
import math

# Configuration
MODEL_PATH = os.path.join(os.getcwd(), "stgcn_v3.tflite")
LABELS = list("ABCDEFGHIJKLMNOPQRSTUVWXYZ")

# Warm start global interpreter
interpreter = None
input_details = None
output_details = None

def get_interpreter():
    global interpreter, input_details, output_details
    if interpreter is None:
        try:
            interpreter = tflite.Interpreter(model_path=MODEL_PATH)
            interpreter.allocate_tensors()
            input_details = interpreter.get_input_details()
            output_details = interpreter.get_output_details()
        except Exception:
            return None
    return interpreter

def reshape_features(array: np.ndarray, target_shape_no_batch: tuple) -> np.ndarray:
    """
    Attempt to reshape feature arrays between flattened (60, 126)
    and spatial (60, 21, 6) representations.
    """
    # target_shape_no_batch is something like (60, 21, 6) or (60, 126)
    
    if len(target_shape_no_batch) == 3 and math.prod(target_shape_no_batch[1:]) == 126:
        # Need (60, 21, 6)
        flat = array.reshape(array.shape[0], -1)
        if flat.shape[-1] != 126:
            raise ValueError(f"Cannot reshape features to 126-length vector. Got {flat.shape[-1]}")
        reshaped = flat.reshape(array.shape[0], 21, 6)
        return reshaped.astype(np.float32)

    if len(target_shape_no_batch) == 2 and target_shape_no_batch[-1] == 126:
        # Need flat representation (60, 126)
        reshaped = array.reshape(array.shape[0], -1)
        if reshaped.shape[-1] != 126:
            raise ValueError(f"Cannot flatten features to 126-length vector. Got {reshaped.shape[-1]}")
        return reshaped.astype(np.float32)

    # Fallback to simple reshape if dimensions match total size
    return array.reshape(target_shape_no_batch).astype(np.float32)

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data)

        landmarks = data.get('landmarks')
        if not landmarks:
            self.send_error_response("Missing landmarks")
            return

        interp = get_interpreter()
        if interp is None:
            self.send_error_response("Model load error")
            return

        try:
            # Prepare input (60, 21, 6)
            input_data = np.array(landmarks, dtype=np.float32)
            
            # Get expected input shape from model
            # input_details[0]['shape'] is something like [1, 60, 21, 6]
            full_expected_shape = input_details[0]['shape']
            expected_shape_no_batch = tuple(int(x) for x in full_expected_shape[1:])
            
            # Handle difference between (60, 126) vs (60, 21, 6)
            if not np.array_equal(input_data.shape, expected_shape_no_batch):
                input_data = reshape_features(input_data, expected_shape_no_batch)
            
            # Add batch dimension
            input_data = np.expand_dims(input_data, axis=0)
            
            # Final verification of shape
            if input_data.shape[0] != full_expected_shape[0] and full_expected_shape[0] != -1:
                # If model expects a specific batch size (e.g. 1) and we have something else, 
                # but usually it's 1 or -1.
                pass 

            interp.set_tensor(input_details[0]['index'], input_data)
            interp.invoke()
            
            output_data = interp.get_tensor(output_details[0]['index'])[0]
            
            # Post-processing from accurate code
            probs = output_data.astype(np.float32)
            probs = np.clip(probs, 1e-9, 1.0)
            probs /= probs.sum()
            
            top_idx = int(np.argmax(probs))
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                "label": LABELS[top_idx],
                "score": float(probs[top_idx]),
                "probabilities": probs.tolist()
            }).encode())

        except Exception as e:
            self.send_error_response(str(e))

    def send_error_response(self, message):
        self.send_response(500)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({"error": message}).encode())
