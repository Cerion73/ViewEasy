import string
import random

def generate_nano_id():
    """Generates a secure 16-character alphanumeric string."""
    return ''.join(random.choices(string.ascii_letters + string.digits, k=16))
