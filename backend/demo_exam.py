import random
from datetime import datetime, timedelta, timezone

def get_demo_exam():
    # Demo Exam object with 20 questions
    questions = []
    
    q_data = [
        ("What does HTML stand for?", ["Hyper Text Markup Language", "High Text Markup Language", "Hyper Tabular Markup Language", "None of these"], "Hyper Text Markup Language"),
        ("Which of the following is not a programming language?", ["Python", "Java", "HTML", "C++"], "HTML"),
        ("What does AI stand for?", ["Artificial Intelligence", "Automated Intelligence", "Advanced Informatics", "Automated Inference"], "Artificial Intelligence"),
        ("What is 15 * 12?", ["170", "180", "190", "160"], "180"),
        ("Which company developed the React library?", ["Google", "Facebook", "Microsoft", "Twitter"], "Facebook"),
        ("What is the main function of an operating system?", ["Manage hardware and software resources", "Run applications", "Provide internet access", "Protect from viruses"], "Manage hardware and software resources"),
        ("In Python, which keyword is used to define a function?", ["func", "def", "function", "lambda"], "def"),
        ("What does SQL stand for?", ["Structured Query Language", "Standard Query Language", "Simple Query Language", "Sequential Query Language"], "Structured Query Language"),
        ("Which of these is a valid IP address?", ["192.168.1.256", "256.0.0.1", "192.168.1.1", "10.0.0.999"], "192.168.1.1"),
        ("What is the base of the hexadecimal number system?", ["8", "10", "16", "2"], "16"),
        ("Which data structure uses LIFO (Last In First Out)?", ["Queue", "Stack", "Tree", "Graph"], "Stack"),
        ("What does API stand for?", ["Application Programming Interface", "Automated Programming Interface", "Application Process Integration", "Advanced Programming Interface"], "Application Programming Interface"),
        ("Which of the following sorting algorithms has the best average-case time complexity?", ["Bubble Sort", "Insertion Sort", "Merge Sort", "Selection Sort"], "Merge Sort"),
        ("What does CSS stand for?", ["Cascading Style Sheets", "Computer Style Sheets", "Creative Style Sheets", "Colorful Style Sheets"], "Cascading Style Sheets"),
        ("What is the time complexity of binary search?", ["O(1)", "O(n)", "O(n log n)", "O(log n)"], "O(log n)"),
        ("Which protocol is used to secure HTTP communication?", ["FTP", "SMTP", "HTTPS", "SSH"], "HTTPS"),
        ("In computer networks, what is a firewall primarily used for?", ["Speeding up internet connection", "Security and access control", "Storing data", "Connecting networks"], "Security and access control"),
        ("What does JSON stand for?", ["JavaScript Object Notation", "Java Standard Output Network", "JavaScript Output Notation", "Java Serialized Object Network"], "JavaScript Object Notation"),
        ("Which of the following is a NoSQL database?", ["MySQL", "PostgreSQL", "MongoDB", "Oracle"], "MongoDB"),
        ("What is the purpose of Git?", ["Version control", "Database management", "Web hosting", "Compiling code"], "Version control")
    ]
    
    for i, (text, options, correct) in enumerate(q_data):
        questions.append({
            "id": f"demo-q{i+1}",
            "text": text,
            "options": options,
            "type": "mcq",
            "correct_answer": correct,
            "marks": 1
        })
        
    start_time = datetime.now(timezone.utc)
    end_time = start_time + timedelta(days=365) # Valid for a year
    
    demo_exam = {
        "_id": "demo-exam-12345",
        "title": "AI Proctoring Demo Exam",
        "subject": "Computer Science",
        "duration_minutes": 10,
        "status": "active",
        "questions": questions,
        "created_at": start_time,
        "start_time": start_time.isoformat(),
        "end_time": end_time.isoformat(),
        "allowed_students": [], # empty implies all for demo
        "is_demo": True # Custom flag
    }
    
    return demo_exam
