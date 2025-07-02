import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__) + '/..'))
from backend import create_app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True)
