import pyodbc
# invisible change

# 🔧 Connection to production Azure SQL
conn = pyodbc.connect(
    'DRIVER={ODBC Driver 18 for SQL Server};'
    'SERVER=instructions.database.windows.net;'
    'DATABASE=instructions;'
    'UID=instructionsadmin;'
    'PWD=qG?-hTyfhsWE0,,}uJB,'
)

cursor = conn.cursor()

# 📦 InstructionRefs to check
cursor.execute("SELECT DISTINCT InstructionRef FROM Instructions")
instruction_refs = [row[0] for row in cursor.fetchall()]

required_tables = {
    'Deals': "SELECT 1 FROM Deals WHERE InstructionRef = ?",
    'Documents': "SELECT 1 FROM Documents WHERE InstructionRef = ?",
    'RiskAssessment': "SELECT 1 FROM RiskAssessment WHERE InstructionRef = ?",
    'IDVerifications': "SELECT 1 FROM IDVerifications WHERE InstructionRef = ?"
}

print("📊 Scenario Coverage Check (Production SQL)")
print("==========================================")

for ref in instruction_refs:
    missing = []
    for label, query in required_tables.items():
        cursor.execute(query, ref)
        if not cursor.fetchone():
            missing.append(label)
    if missing:
        print(f"{ref}: ❌ MISSING -> {', '.join(missing)}")
    else:
        print(f"{ref}: ✅ COMPLETE")

conn.close()
