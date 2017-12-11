import os
from subprocess import call

os.environ['FLASK_APP'] = 'Main.py'
os.environ['FLASK_DEBUG'] = '1'
call(["flask", "run"])
