class Rooms:

    def __init__(self):
        self.rooms = {}

    def add_room(self, room):
        self.rooms[room.id] = room

    def remove_room(self, id):
        del self.rooms[id]

    def get_all(self):
        return self.rooms

    def get(self, room_id):
        return self.rooms[room_id]

    def exists(self, room_id):
        return room_id in self.rooms
