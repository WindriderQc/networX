#!/bin/bash

#For example, when a remainder operation returns zero, it indicates that the first number is an exact multiple of the second. This can be very handy:


number=0

read -p "Enter a number > " number

echo "Number is $number"
if [ $((number % 2)) -eq 0 ]; then
    echo "Number is even"
else
    echo "Number is odd"
fi 
