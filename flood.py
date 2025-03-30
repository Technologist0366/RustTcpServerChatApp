import socket
import threading

def flood():
    while True:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.connect(('127.0.0.1', 8080))
        s.send(b"FLOOD\n")
        s.close()

for _ in range(50):
    threading.Thread(target=flood).start()