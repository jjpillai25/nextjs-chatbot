from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(
    api_key=os.getenv("GROQ_API_KEY"), #(who you are)
    base_url="https://api.groq.com/openai/v1"    #(Where to send the req)
)

while True: #(loop starts)

    question = input("What is your question? ")  #tskes input from user

    if question.lower() == "exit": #to exit the loop and end the program
        break

    #Send the question to the OpenAI API and get the response
    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            #{"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": question}
        ],
        temperature=0.7
    )
    
    print("########################### -----------------------  Response:", response) #Print the raw response for debugging
    answer = response.choices[0].message.content #Extract the answer from the response
    #print("Answer:", answer)

