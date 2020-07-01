import time
import random
import sys
import csv
import math
import threading
import json
import re
from os import listdir
import os
import tarfile
import gzip

def make_gz(input_filename):
	input = open(input_filename, 'rb')
	s = input.read()
	input.close()

	output = gzip.GzipFile(input_filename+'.gz', 'wb')
	output.write(s)
	output.close()
    #with tarfile.open(output_filename, "w:gz") as tar:
    #    tar.add(input_filename, arcname=os.path.basename(source_dir))
        
        
def writecsv(parr, filen):
		with open(filen, 'w') as csvfile:
				spamwriter = csv.writer(csvfile, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
				for i in range(0,len(parr)):
						try:
								spamwriter.writerow(parr[i])
						except:
								print(parr[i], i)
def writenewcsv(parr, filen):
		with open(filen, 'w') as csvfile:
				spamwriter = csv.writer(csvfile, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
				for i in range(0,len(parr)):
						try:
								spamwriter.writerow(parr[i])
						except:
								print(parr[i], i)

def readtsv(filen):
	allgamesa  ={}
	with open(filen, 'r') as csvfile:
		spamreader = csv.reader(csvfile, delimiter='\t', quotechar='"')
		for row in spamreader:
			allgamesa[row[0]]={'text':row[2],'user':row[3],'links':[],'tags':[]}
			
	return allgamesa

def readcsv(filen):
	allgamesa  ={}
	with open(filen, 'r') as csvfile:
		spamreader = csv.reader(csvfile, delimiter='\t', quotechar='"')
		for row in spamreader:
			try:
				allgamesa[row[0]].append(row[1])
			except:
				allgamesa[row[0]] = [row[1]]
			
	return allgamesa

def readratings(filen):
	allgamesa  ={}
	with open(filen, 'r') as csvfile:
		spamreader = csv.reader(csvfile, delimiter='\t', quotechar='"')
		for row in spamreader:
			try:
				allgamesa[row[1]].append([row[0],row[2]])
			except:
				allgamesa[row[1]] = [[row[0],row[2]]]
			
	return allgamesa

def readtags(filen):
	allgamesa  ={}
	with open(filen, 'r') as csvfile:
		spamreader = csv.reader(csvfile, delimiter='\t', quotechar='"')
		for row in spamreader:
			try:
				allgamesa[row[0]].append(row[1])
			except:
				allgamesa[row[0]] = [row[1]]
			
	return allgamesa

def readabilities(filen):
	allgamesa  ={}
	with open(filen, 'r') as csvfile:
		spamreader = csv.reader(csvfile, delimiter='\t', quotechar='"')
		for row in spamreader:
			if len(row)>2:
				try:
					allgamesa[row[2]].append([row[0],row[1]])
				except:
					allgamesa[row[2]] = [[row[0],row[1]]]
			
	return allgamesa


print(time.time())
abilities = readabilities('user_languages.csv')

fra_fluent = []
eng_fluent = []
for i in abilities.keys():
	langs = abilities[i]
	for ii in range(0,len(langs)):
		if langs[ii][0] == 'fra':
			if langs[ii][1] != '\\N':
				if int(langs[ii][1]) > 4:
					fra_fluent.append(i)
		if langs[ii][0] == 'eng':
			if langs[ii][1] != '\\N':
				if int(langs[ii][1]) > 4:
					eng_fluent.append(i)


tags = readtags('tags.csv')
ratings = readratings('users_sentences.csv')
eng_ratings = {}
fra_ratings = {}
for i in ratings.keys():
	rating = -1000
	ratingf = -1000
	for ii in range(0,len(ratings[i])):
		if ratings[i][ii][0] in eng_fluent:
			if rating == -1000:
				rating = int(ratings[i][ii][1])
			else:
				rating += int(ratings[i][ii][1])
		if ratings[i][ii][0] in fra_fluent:
			if ratingf == -1000:
				ratingf = int(ratings[i][ii][1])
			else:
				ratingf += int(ratings[i][ii][1])
	if rating > 0:
		eng_ratings[i]=rating
	if ratingf > 0:
		fra_ratings[i]=ratingf


links = readcsv('links.csv')

print(time.time())
eng_sentences = readtsv('eng_sentences_detailed.tsv')
print(time.time())
fra_sentences = readtsv('fra_sentences_detailed.tsv')
print(time.time())
good_english = {}
eng_keys = eng_sentences.keys()
print(len(eng_keys))
for i in eng_keys:
	sentence = eng_sentences[i]
	if sentence['user'] in eng_fluent:
		try:
			if eng_ratings[i]>0:
				good_english[i]=sentence
		except:
			pass
	else:
		try:
			if eng_ratings[i]>1:
				good_english[i]=sentence
		except:
			pass
print(len(good_english.keys()))
print(time.time())

good_french = {}
fra_keys = fra_sentences.keys()
print(len(fra_keys))
for i in fra_keys:
	sentence = fra_sentences[i]
	if sentence['user'] in fra_fluent:
		try:
			if fra_ratings[i]<0:
				donot = 0
			else:
				good_french[i]=sentence
		except:
			good_french[i]=sentence
	else:
		try:
			if fra_ratings[i]>0:
				good_french[i]=sentence
		except:
			pass
print(len(good_french.keys()))
print(time.time())

good_english_links = {}
good_french_links = {}
gff = 0
for i in links.keys():
	for ii in links[i]:
		try:
			fr = good_french[ii]
			good_english[i]['links'].append(ii)
			good_english_links[i]={}
		except:
			pass
		try:
			fr = good_english[ii]
			gff += 1
			good_french[i]['links'].append(ii)
			good_french_links[i]={}
		except:
			pass
print(gff)
print(time.time())

gf = 0
for i in good_english_links.keys():
	good_english_links[i]=good_english[i]
	try:
		good_english_links[i]['tags'] = tags[i]
	except:
		good_english_links[i]['tags'] = []
	gf += len(good_english_links[i]['links'])
print(len(good_english_links.keys()))
print(gf)

gf = 0
for i in good_french_links.keys():
	good_french_links[i]=good_french[i]
	try:
		good_french_links[i]['tags'] = tags[i]
	except:
		good_french_links[i]['tags'] = []
	gf += len(good_french_links[i]['links'])
print(len(good_french_links.keys()))
print(gf)

print(time.time())
myjson = {'etof':good_english_links,'ftoe':good_french_links}
with open('english-french.json', 'w') as outfile:
	json.dump(myjson, outfile)




