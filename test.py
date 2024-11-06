import requests

# URL du site
url = 'https://stealer.to/post?uniqueld=3f654711'

# Faire une requête GET et récupérer la réponse
response = requests.get(url)

# Vérifier si la requête a réussi (code 200)
if response.status_code == 200:
    try:
        # Convertir la réponse en JSON
        data = response.json()
        print(data)
    except requests.exceptions.JSONDecodeError:
        print("La réponse n'est pas au format JSON.")
        print("Contenu de la réponse:")
        print(response.text)  # Afficher le contenu brut de la réponse
else:
    print(f"Erreur {response.status_code}: La requête a échoué")
