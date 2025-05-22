from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import uuid
from datetime import datetime

app = Flask(__name__)
CORS(app)

DATA_FILE = 'data.json'

def load_data():
    try:
        with open(DATA_FILE, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {"equipment": [], "reservations": []}

def save_data(data):
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=2)

@app.route('/equipos', methods=['GET'])
def get_equipment():
    data = load_data()
    return jsonify(data.get("equipment", []))

@app.route('/reservas', methods=['GET'])
def get_reservations():
    data = load_data()
    equipment_id = request.args.get('equipo_id')
    reservas = data.get("reservations", [])
    if equipment_id:
        reservas = [r for r in reservas if r["equipo_id"] == equipment_id]
    return jsonify(reservas)

@app.route('/reservas', methods=['POST'])
def create_reservation():
    data = load_data()
    reservas = data.setdefault("reservations", [])

    req = request.get_json()
    title = req.get("title")
    start = req.get("start")
    end = req.get("end")
    equipo_id = req.get("equipo_id")

    if not all([title, start, end, equipo_id]):
        return jsonify({"error": "Faltan campos requeridos"}), 400

    # Parse datetimes
    try:
        start_dt = datetime.fromisoformat(start)
        end_dt = datetime.fromisoformat(end)
    except ValueError:
        return jsonify({"error": "Formato de fecha inválido"}), 400

    # Verificar conflicto
    for r in reservas:
        if r["equipo_id"] == equipo_id:
            existing_start = datetime.fromisoformat(r["start"])
            existing_end = datetime.fromisoformat(r["end"])
            if start_dt < existing_end and end_dt > existing_start:
                return jsonify({"error": "El equipo ya está reservado en ese horario"}), 409

    new_reserva = {
        "id": str(uuid.uuid4()),
        "title": title,
        "start": start,
        "end": end,
        "equipo_id": equipo_id
    }

    reservas.append(new_reserva)
    save_data(data)

    return jsonify(new_reserva), 201

if __name__ == '__main__':
    app.run(debug=True)
