class Rooms:

    def __init__(self):
        self.rooms = {}

    def add_room(self, room):
        self.rooms[room.id] = room

    def remove_room(self, roomId):
        del self.rooms[roomId]

    def get_all(self):
        return self.rooms

    def get(self, roomId):
        return self.rooms[roomId]

    def exists(self, roomId):
        return roomId in self.rooms
