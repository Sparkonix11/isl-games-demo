"""
Local Python server for ISL gesture prediction using TFLite model.
Run this alongside the Next.js dev server for local development.

Usage:
    python server.py

The server will run on http://localhost:5000/api/predict
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import numpy as np
import os
import math

# Try to import the TFLite interpreter
try:
    import ai_edge_litert.interpreter as tflite
except ImportError:
    try:
        import tflite_runtime.interpreter as tflite
    except ImportError:
        import tensorflow.lite as tflite

# Configuration
MODEL_PATH = os.path.join(os.path.dirname(__file__), "stgcn_v3.tflite")
LABELS = list("ABCDEFGHIJKLMNOPQRSTUVWXYZ")
PORT = 5000

# Global interpreter
interpreter = None
input_details = None
output_details = None


def get_interpreter():
    global interpreter, input_details, output_details
    if interpreter is None:
        try:
            print(f"Loading model from: {MODEL_PATH}")
            interpreter = tflite.Interpreter(model_path=MODEL_PATH)
            interpreter.allocate_tensors()
            input_details = interpreter.get_input_details()
            output_details = interpreter.get_output_details()
            print("Model loaded successfully!")
        except Exception as e:
            print(f"Error loading model: {e}")
            return None
    return interpreter


def reshape_features(array: np.ndarray, target_shape_no_batch: tuple) -> np.ndarray:
    if len(target_shape_no_batch) == 3 and math.prod(target_shape_no_batch[1:]) == 126:
        flat = array.reshape(array.shape[0], -1)
        if flat.shape[-1] != 126:
            raise ValueError(f"Cannot reshape features to 126-length vector. Got {flat.shape[-1]}")
        reshaped = flat.reshape(array.shape[0], 21, 6)
        return reshaped.astype(np.float32)

    if len(target_shape_no_batch) == 2 and target_shape_no_batch[-1] == 126:
        reshaped = array.reshape(array.shape[0], -1)
        if reshaped.shape[-1] != 126:
            raise ValueError(f"Cannot flatten features to 126-length vector. Got {reshaped.shape[-1]}")
        return reshaped.astype(np.float32)

    return array.reshape(target_shape_no_batch).astype(np.float32)


class PredictHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        # Handle CORS preflight
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        if self.path == '/api/predict' or self.path == '/':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response = {
                "status": "ok",
                "message": "ISL Predict Server is running",
                "model_path": MODEL_PATH,
                "model_loaded": interpreter is not None
            }
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_error(404)

    def do_POST(self):
        if self.path != '/api/predict':
            self.send_error(404)
            return

        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)

        try:
            data = json.loads(post_data)
            landmarks = data.get('landmarks')

            if not landmarks:
                self.send_json_response({"error": "Missing landmarks"}, 400)
                return

            interp = get_interpreter()
            if interp is None:
                self.send_json_response({"error": "Model not loaded"}, 500)
                return

            # Prepare input
            input_data = np.array(landmarks, dtype=np.float32)
            full_expected_shape = input_details[0]['shape']
            expected_shape_no_batch = tuple(int(x) for x in full_expected_shape[1:])

            if not np.array_equal(input_data.shape, expected_shape_no_batch):
                input_data = reshape_features(input_data, expected_shape_no_batch)

            input_data = np.expand_dims(input_data, axis=0)

            interp.set_tensor(input_details[0]['index'], input_data)
            interp.invoke()

            output_data = interp.get_tensor(output_details[0]['index'])[0]
            probs = output_data.astype(np.float32)
            probs = np.clip(probs, 1e-9, 1.0)
            probs /= probs.sum()

            top_idx = int(np.argmax(probs))

            self.send_json_response({
                "label": LABELS[top_idx],
                "score": float(probs[top_idx]),
                "probabilities": probs.tolist()
            })

        except Exception as e:
            print(f"Prediction error: {e}")
            self.send_json_response({"error": str(e)}, 500)

    def send_json_response(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def log_message(self, format, *args):
        # Quieter logging
        if '404' in str(args) or 'error' in str(args).lower():
            print(f"[{self.log_date_time_string()}] {args[0]}")


def main():
    # Pre-load the model
    get_interpreter()

    server = HTTPServer(('0.0.0.0', PORT), PredictHandler)
    print(f"\n🚀 ISL Predict Server running at http://localhost:{PORT}")
    print(f"   POST /api/predict - Send hand landmarks for prediction")
    print(f"   GET  /api/predict - Health check\n")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n\nShutting down server...")
        server.shutdown()


if __name__ == '__main__':
    main()
