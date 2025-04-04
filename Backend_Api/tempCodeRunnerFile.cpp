#include <iostream>
#include <vector>
using namespace std;
int main() {
    // Write C++ code here
    // std::cout << "Try programiz.pro"
    int left =0;
    
    
    int i=1;
    vector<int>arr = {3,2,4,6,0,-1};
    int n = arr.size();
    int right = n-1;
    while(i<n-2){
        int leftsum =0;
        int rightsum =0;
        while(left<i){
            leftsum+=arr[left];
        }
        while(right>i){
            rightsum+=arr[right];
        }
        
        if(leftsum == rightsum){
            cout<<i<<endl;
        }
        
    }

    return 0;
}