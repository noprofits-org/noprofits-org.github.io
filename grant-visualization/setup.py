#!/usr/bin/env python3
import venv
import subprocess
import os
import sys
from pathlib import Path
import webbrowser
from http.server import HTTPServer, SimpleHTTPRequestHandler
import threading

class VenvManager:
    def __init__(self, venv_path=".venv"):
        self.venv_path = Path(venv_path)
        self.python_path = self.venv_path / ('Scripts' if sys.platform == 'win32' else 'bin')
        self.pip_path = self.python_path / ('pip.exe' if sys.platform == 'win32' else 'pip')
        self.python_executable = self.python_path / ('python.exe' if sys.platform == 'win32' else 'python')

    def create_venv(self):
        try:
            print(f"Creating virtual environment at {self.venv_path}...")
            venv.create(self.venv_path, with_pip=True, clear=True)
            print("Virtual environment created successfully")
            
            # Verify the environment was created
            if not self.venv_path.exists():
                raise Exception("Virtual environment directory was not created")
            if not (self.python_path / 'activate').exists():
                raise Exception("Activation script not found")
                
        except Exception as e:
            print(f"Error creating virtual environment: {str(e)}")
            print("\nTrying alternative method...")
            try:
                # Try using python3 -m venv directly
                subprocess.run([sys.executable, '-m', 'venv', str(self.venv_path)], check=True)
                print("Virtual environment created using alternative method")
            except subprocess.CalledProcessError as e:
                print(f"Failed to create virtual environment: {str(e)}")
                sys.exit(1)

    def install_requirements(self):
        requirements = [
            'selenium',
            'requests',
            'webdriver-manager'
        ]
        
        print("Installing requirements...")
        try:
            # Upgrade pip first
            subprocess.run([str(self.pip_path), 'install', '--upgrade', 'pip'], check=True)
            
            # Install requirements
            subprocess.run([str(self.pip_path), 'install'] + requirements, check=True)
            print("Requirements installed successfully")
        except subprocess.CalledProcessError as e:
            print(f"Error installing requirements: {str(e)}")
            sys.exit(1)

class TestServer(threading.Thread):
    def __init__(self, port=8000):
        super().__init__(daemon=True)
        self.port = port
        self.server = None
        
    def run(self):
        handler = SimpleHTTPRequestHandler
        self.server = HTTPServer(('localhost', self.port), handler)
        print(f"\nServer started at http://localhost:{self.port}")
        print("Press Ctrl+C to stop the server\n")
        self.server.serve_forever()

    def stop(self):
        if self.server:
            self.server.shutdown()
            self.server.server_close()

def check_python_version():
    if sys.version_info < (3, 6):
        print("Error: Python 3.6 or higher is required")
        sys.exit(1)

def main():
    check_python_version()
    
    # Create the virtual environment
    print("\n=== Setting up development environment ===\n")
    venv_manager = VenvManager()
    
    # Always recreate the virtual environment
    if venv_manager.venv_path.exists():
        print(f"Removing existing virtual environment at {venv_manager.venv_path}")
        import shutil
        shutil.rmtree(venv_manager.venv_path)
    
    venv_manager.create_venv()
    venv_manager.install_requirements()
    
    # Print activation instructions
    activate_path = venv_manager.python_path / 'activate'
    print("\n=== Virtual Environment Created ===")
    print(f"To activate the virtual environment, run:")
    print(f"source {activate_path}")
    
    # Start the server
    print("\n=== Starting Development Server ===")
    server = TestServer()
    server.start()
    
    # Open the webpage
    webbrowser.open(f'http://localhost:8000/grant-visualization.html')
    
    try:
        while True:
            pass
    except KeyboardInterrupt:
        print("\nShutting down server...")
        server.stop()
        print("Server stopped.")

if __name__ == "__main__":
    main()