import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Button, Container, Row, Col, Spinner } from "react-bootstrap";
import { db } from './firebaseConfig';
import { collection,getDoc, doc, query, where, getDocs,updateDoc, arrayUnion } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // For getting user's email
import { auth } from "./firebaseConfig";
import { signOut, onAuthStateChanged } from "firebase/auth";


function CandidateView() {
    const [startedTests, setStartedTests] = useState([]);
    const [isLoading, setIsLoading] = useState(false); // Loading state for fetching tests
    const navigate = useNavigate();
    const [loadingTestId, setLoadingTestId] = useState(null); // Track which test is loading
    const auth = getAuth();

    const handleLogout = async () => {
        const confirmLogout = window.confirm("Are you sure you want to log out?");
        if (confirmLogout) {
            try {
                await signOut(auth);
                navigate("/"); // Redirect to login/signup page after logout
            } catch (error) {
                console.error("Error signing out:", error);
            }
        }
    };
    
    useEffect(() => {
        const fetchStartedTests = async () => {
            setIsLoading(true);
            try {
                const testsRef = collection(db, "tests");
                const startedQuery = query(testsRef, where("started", "==", true), where("ended", "==", false)); // Filter tests that are started
                const querySnapshot = await getDocs(startedQuery);
                const startedData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setStartedTests(startedData);
            } catch (error) {
                console.error("Error fetching started tests:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStartedTests();
    }, []);
    const checkIfAttempted = async (testId) => {
        setLoadingTestId(testId); // Set loading state for the clicked test
        try {
            const email = auth.currentUser?.email;
            const testDocRef = doc(db, "tests", testId);
            const testDocSnap = await getDoc(testDocRef);
    
            if (testDocSnap.exists()) {
                const testData = testDocSnap.data();
                const report = testData.report || []; // Ensure there's a report array
    
                // Check if any report contains the user's email
                const alreadyAttempted = report.some((entry) => entry.email === email);
                if (alreadyAttempted) {
                    alert("You have already attempted this test!");
                } else {
                    // Extract question IDs from the `questions` array
                    const questionIds = testData.questions.map(q => q.id); // Extract only the `id` field
    
                    const questionPromises = questionIds.map(async (questionId) => {
                        console.log("Fetching question for ID:", questionId); // Debugging line
                        if (typeof questionId === "string") {
                            const questionRef = doc(db, "questions", questionId); // Ensure questionId is a valid string
                            const questionSnapshot = await getDoc(questionRef);
                            if (questionSnapshot.exists()) {
                                return { id: questionSnapshot.id, ...questionSnapshot.data() };
                            }
                        } else {
                            console.log("Invalid questionId:", questionId); // Debugging invalid ID
                        }
                        return null; // If question doesn't exist or ID is invalid
                    });
    
                    // Wait for all question fetches to complete and filter out null results
                    const questions = (await Promise.all(questionPromises)).filter(q => q !== null);
    
                    // Create a report entry with full question details
                    const reportEntry = {
                        email: email,
                        duration: "undefined", // Update duration as needed
                        questions: questions.map(q => ({
                            questionName: q.questionName,
                            score: 0,
                            testCasesPassed: 0,
                            totalScore: 0,
                            totalTestCases: 0
                        }))
                    };
    
                    // Update the test document with the new report entry
                    await updateDoc(testDocRef, {
                        report: arrayUnion(reportEntry) // Adds the new entry with the user's email and question details
                    });
    
                    // Navigate to the exam page
                    navigate(`/test/${testId}/exam`);
                }
            } else {
                console.log("Test not found!");
            }
        } catch (error) {
            console.error("Error checking test attempt:", error);
        } finally {
            setLoadingTestId(null); // Reset the loading state after the check is complete
        }
    };
    

    // Helper function to render each test row with the attempt button
    const renderTableRow = (test) => {
        const duration = test.duration ? `${test.duration} min` : "N/A"; // Assuming duration is in minutes
        return (
            <tr key={test.id}>
                <td>{test.testname}</td>
                <td>{duration}</td>
                <td>{test.questions.length}</td>
                <td>
                    <Button 
                        variant="primary" 
                        onClick={() => checkIfAttempted(test.id)}
                        disabled={loadingTestId === test.id} // Disable the button while loading
                    >
                        {loadingTestId === test.id ? (
                            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                        ) : (
                            "Attempt Test"
                        )}
                    </Button>
                </td>
            </tr>
        );
    };

    return (
        <Container className="my-4">
            <Row className="mb-3">
                <Col className="text-end">
                <Button className="ms-2" onClick={handleLogout} variant="primary">
                        Logout
                    </Button>
                </Col>
                
            </Row>

            <h3>Started Tests</h3>

            {/* Display loading spinner while tests are being fetched */}
            {isLoading ? (
                <div className="text-center">
                    <Spinner animation="border" />
                </div>
            ) : (
                <Table striped bordered hover responsive className="mt-4">
                    <thead>
                        <tr>
                            <th>Test Name</th>
                            <th>Duration</th>
                            <th>No. of Questions</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {startedTests.map(renderTableRow)}
                    </tbody>
                </Table>
            )}
        </Container>
    );
}

export default CandidateView;
