import os
import sys
import subprocess

def main():
    # Find directories
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.dirname(backend_dir)
    
    # Determine python path in venv
    if os.name == 'nt':  # Windows
        python_exe = os.path.join(root_dir, '.venv', 'Scripts', 'python.exe')
    else:
        python_exe = os.path.join(root_dir, '.venv', 'bin', 'python')
        
    if not os.path.exists(python_exe):
        print(f"Error: Virtual environment python not found at '{python_exe}'.")
        print("Please ensure the virtual environment '.venv' is created in the root folder.")
        sys.exit(1)
        
    manage_py = os.path.join(backend_dir, 'manage.py')
    
    print("=" * 60)
    print("           Launching ViewEasy DRF Backend Server")
    print("=" * 60)
    print(f"Venv Python: {python_exe}")
    print(f"Manage script: {manage_py}")
    print("API Base URL: http://127.0.0.1:8000/api/")
    print("Browsable API endpoints will be accessible there.")
    print("Press Ctrl+C to terminate the server.\n")
    
    try:
        subprocess.run([python_exe, manage_py, 'runserver'], check=True)
    except KeyboardInterrupt:
        print("\nStopping server.")
    except subprocess.CalledProcessError as e:
        print(f"\nServer exited with error code {e.returncode}")
    except Exception as e:
        print(f"\nFailed to launch server: {e}")

if __name__ == '__main__':
    main()
