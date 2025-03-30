use tokio::net::{TcpListener, TcpStream};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use std::sync::Arc;
use tokio::sync::Mutex;
use std::collections::HashMap;
use tokio::net::tcp::OwnedWriteHalf;

#[tokio::main]
async fn main() -> tokio::io::Result<()> {
    let listener = TcpListener::bind("127.0.0.1:8080").await?;
    println!("Server running on 127.0.0.1:8080");

    let clients: Arc<Mutex<HashMap<String, OwnedWriteHalf>>> = Arc::new(Mutex::new(HashMap::new()));

    loop {
        let (socket, addr) = listener.accept().await?;
        let clients = Arc::clone(&clients);
        let addr_str = addr.to_string();

        tokio::spawn(async move {
            handle_client(socket, addr_str, clients).await;
        });
    }
}

async fn handle_client(socket: TcpStream, addr: String, clients: Arc<Mutex<HashMap<String, OwnedWriteHalf>>>) {
    let (mut reader, writer) = socket.into_split();

    {
        let mut clients_lock = clients.lock().await;
        clients_lock.insert(addr.clone(), writer);
    }

    let mut buffer = [0; 1024];

    loop {
        match reader.read(&mut buffer).await {
            Ok(n) if n > 0 => {
                let msg = String::from_utf8_lossy(&buffer[..n]).to_string();
                println!("{}: {}", addr, msg);

                let mut clients_lock = clients.lock().await;
                for (client_addr, client_writer) in clients_lock.iter_mut() {
                    if client_addr != &addr {
                        client_writer.write_all(msg.as_bytes()).await.unwrap_or_else(|e| {
                            eprintln!("Failed to send to {}: {}", client_addr, e);
                        });
                    }
                }
            }
            Ok(_) => {
                println!("Client {} disconnected", addr);
                let mut clients_lock = clients.lock().await;
                clients_lock.remove(&addr);
                break;
            }
            Err(e) => {
                eprintln!("Error reading from {}: {}", addr, e);
                let mut clients_lock = clients.lock().await;
                clients_lock.remove(&addr);
                break;
            }
        }
    }
}