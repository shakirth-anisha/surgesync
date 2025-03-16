from flask import Flask, request, jsonify

app = Flask(__name__)

# Initialize the list of dictionaries
data_list = []

@app.route('/append', methods=['POST'])
def append_item():
    item = request.json
    if isinstance(item, dict):
        data_list.append(item)
        return jsonify({"message": "Item added successfully", "data": data_list}), 201
    return jsonify({"error": "Invalid data format, must be a dictionary"}), 400

@app.route('/remove', methods=['POST'])
def remove_item():
    item = request.json
    if item in data_list:
        data_list.remove(item)
        return jsonify({"message": "Item removed successfully", "data": data_list}), 200
    return jsonify({"error": "Item not found in the list"}), 404

@app.route('/list', methods=['GET'])
def list_items():
    return jsonify(data_list), 200

if __name__ == '__main__':
    app.run(debug=True)