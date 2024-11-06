from flask import Flask, render_template, jsonify, request
import subprocess
import re
import os
import logging
from colorama import Fore


class PingerWeb:
    def __init__(self):
        self.app = Flask(__name__)
        self.app.add_url_rule('/', 'index', self.index)
        self.app.add_url_rule('/ping', 'ping', self.ping, methods=['GET'])
        self.red = Fore.LIGHTRED_EX
        self.green = Fore.LIGHTGREEN_EX

    def run(self):
        self.app.run(debug=True)

    def index(self):
        return render_template('index.html')

    def ping(self):
        
        target = request.args.get('target', '')
        if not target:
            return jsonify({'error': 'A target is required.'}), 400
        print(f'{self.green}[+] >> Ping domaine : ', target)
        try:
            result = subprocess.run(
                ['ping', '-n', '1', '-w', '6000', target],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                encoding='utf-8',
                errors='ignore'
            )

            if result.returncode != 0:
                return jsonify({'error': 'command failed.'}), 500

            matches = re.findall(r'temps\s*=\s*(\d+)\s*ms', result.stdout)
            if matches:
                latencies = list(map(int, matches))
                avg_latency = sum(latencies) / len(latencies)
                return jsonify({'latency': avg_latency})
            else:
                print(f'{self.red}[-] >> \'error\': \'#>> ping not found : ')
                return jsonify({'error': '#>> ping not found'}), 500

        except Exception as e:
            print(f'{self.red}[-] >> {e} : ')
            return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    logging.getLogger('werkzeug').setLevel(logging.ERROR)
    os.system('cls')
    app = PingerWeb()
    app.run()
