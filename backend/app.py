from flask import Flask, jsonify, request
import json
import uuid # For generating unique IDs

app = Flask(__name__)

DATA_FILE = 'data.json'

def load_data():
    try:
        with open(DATA_FILE, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        # This case should ideally not happen if data.json is always created
        return {"equipment": [], "reservations": []}

def save_data(data):
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=2)

@app.route('/api/equipment', methods=['GET'])
def get_equipment():
    data = load_data()
    return jsonify(data.get("equipment", []))

@app.route('/api/reservations', methods=['GET'])
def get_reservations():
    data = load_data()
    all_reservations = data.get("reservations", [])
    
    equipment_id_filter = request.args.get('equipment_id')

    if equipment_id_filter:
        filtered_reservations = [
            res for res in all_reservations if res.get('equipment_id') == equipment_id_filter
        ]
        return jsonify(filtered_reservations)
    else:
        return jsonify(all_reservations)

@app.route('/api/reservations', methods=['POST'])
def create_reservation():
    data = load_data()
    new_reservation_data = request.get_json()

    if not new_reservation_data:
        return jsonify({"error": "Invalid input"}), 400

    equipment_id = new_reservation_data.get('equipment_id')
    date = new_reservation_data.get('date')
    start_time = new_reservation_data.get('start_time')
    end_time = new_reservation_data.get('end_time')
    title = new_reservation_data.get('title')

    if not all([equipment_id, date, start_time, end_time, title]):
        return jsonify({"error": "Missing fields in reservation data"}), 400

    # Conflict Detection
    for r in data.get("reservations", []):
        if r['equipment_id'] == equipment_id and r['date'] == date:
            # Check for time overlap
            # (StartA < EndB) and (EndA > StartB)
            if start_time < r['end_time'] and end_time > r['start_time']:
                return jsonify({"error": "Equipment already reserved for this time slot"}), 409

    # No conflict, create new reservation
    new_reservation = {
        "id": str(uuid.uuid4()), # Generate unique ID
        "equipment_id": equipment_id,
        "date": date,
        "start_time": start_time,
        "end_time": end_time,
        "title": title
    }

    data.setdefault("reservations", []).append(new_reservation)
    save_data(data)

    return jsonify(new_reservation), 201

if __name__ == '__main__':
    app.run(debug=True)